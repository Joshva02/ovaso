import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------- helpers ----------

async function hmacSign(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const key = crypto.getRandomValues(new Uint8Array(32));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign("HMAC", cryptoKey, aBytes),
    crypto.subtle.sign("HMAC", cryptoKey, bBytes),
  ]);
  const viewA = new Uint8Array(macA);
  const viewB = new Uint8Array(macB);
  let result = 0;
  for (let i = 0; i < viewA.length; i++) {
    result |= viewA[i] ^ viewB[i];
  }
  return result === 0;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---------- validate-key (existing) ----------

http.route({
  path: "/validate-key",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { key } = await request.json();

    if (!key) {
      return jsonResponse({ valid: false }, 400);
    }

    const apiKey = await ctx.runQuery(api.apiKeys.validate, { key });

    if (!apiKey) {
      return jsonResponse({ valid: false });
    }

    await ctx.runMutation(api.apiKeys.trackUsage, { keyId: apiKey.keyId });

    return jsonResponse({
      valid: true,
      plan: apiKey.plan,
      userId: apiKey.userId,
    });
  }),
});

// ---------- create-checkout ----------

http.route({
  path: "/create-checkout",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { userId, plan, billingCycle } = await request.json();

    if (!userId || !plan || !billingCycle) {
      return jsonResponse({ error: "userId, plan, and billingCycle are required" }, 400);
    }

    const PRICES: Record<string, Record<string, number>> = {
      pro:      { monthly: 12900, annual: 129000 },
      business: { monthly: 33900, annual: 339000 },
    };

    const LABELS: Record<string, string> = {
      pro: "Ovaso Pro",
      business: "Ovaso Business",
    };

    const priceTable = PRICES[plan];
    if (!priceTable) {
      return jsonResponse({ error: "Invalid plan" }, 400);
    }

    const amountCents = priceTable[billingCycle];
    if (!amountCents) {
      return jsonResponse({ error: "Invalid billing cycle" }, 400);
    }

    const WAM_API_KEY = process.env.WAM_API_KEY;
    const WAM_ENVIRONMENT = process.env.WAM_ENVIRONMENT ?? "staging";

    if (!WAM_API_KEY) {
      return jsonResponse({ error: "Payment system not configured" }, 500);
    }

    const baseUrl =
      WAM_ENVIRONMENT === "production"
        ? "https://billing.wam.money"
        : "https://staging.billing.wam.money";

    const currency = "TTD";
    const cycleLabel = billingCycle === "annual" ? "yr" : "mo";
    const description = `${LABELS[plan]} (${cycleLabel})`;
    const orderReference = `ovaso_${plan}_${billingCycle}_${userId}_${Date.now()}`;
    const returnUrl = `${process.env.SITE_URL ?? "https://ovaso.dev"}/dashboard?payment=processing`;

    // 1. Create pending payment in DB
    const paymentDocId = await ctx.runMutation(api.payments.createPending, {
      userId,
      orderReference,
      amountCents,
      currency,
    });

    // 2. Create payment intent via Wam API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      amountCents,
      currency,
      orderReference,
      description,
      returnUrl,
    });

    const signature = await hmacSign(WAM_API_KEY, `${timestamp}.${body}`);

    try {
      const response = await fetch(`${baseUrl}/api/public/payment-intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WAM-Api-Key": WAM_API_KEY,
          "X-WAM-Timestamp": timestamp,
          "X-WAM-Signature": signature,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Wam API error:", response.status, errorText);
        return jsonResponse({ error: "Failed to create payment" }, 502);
      }

      const responseData = await response.json();
      const intent = responseData.data ?? responseData;

      // 3. Update payment record with Wam payment ID
      await ctx.runMutation(api.payments.updateWithPaymentId, {
        paymentDocId,
        paymentId: intent.paymentId,
        checkoutUrl: intent.checkoutUrl,
      });

      return jsonResponse({ checkoutUrl: intent.checkoutUrl });
    } catch (error) {
      console.error("Wam API request failed:", error);
      return jsonResponse({ error: "Payment service unavailable" }, 502);
    }
  }),
});

http.route({
  path: "/create-checkout",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }),
});

// ---------- wam-webhook ----------

http.route({
  path: "/wam-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const WAM_WEBHOOK_SECRET = process.env.WAM_WEBHOOK_SECRET;

    if (!WAM_WEBHOOK_SECRET) {
      console.error("WAM_WEBHOOK_SECRET not configured");
      return jsonResponse({ error: "Webhook not configured" }, 500);
    }

    const rawBody = await request.text();
    const signature = request.headers.get("X-WAM-Signature") ?? "";
    const timestamp = request.headers.get("X-WAM-Timestamp") ?? "";

    // Verify signature
    const expectedSig = await hmacSign(WAM_WEBHOOK_SECRET, `${timestamp}.${rawBody}`);
    const valid = await constantTimeEqual(signature, expectedSig);

    if (!valid) {
      console.error("Invalid webhook signature");
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    // Check timestamp freshness (±5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      return jsonResponse({ error: "Timestamp too old" }, 401);
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type ?? event.eventType;
    const orderReference = event.data?.orderReference ?? event.data?.merchantReference;

    if (!orderReference) {
      console.error("Webhook missing orderReference:", event);
      return jsonResponse({ received: true });
    }

    console.log("Webhook received:", eventType, orderReference);

    if (eventType === "payment_intent.succeeded") {
      const result = await ctx.runMutation(api.payments.updateStatus, {
        orderReference,
        status: "succeeded",
      });

      // Parse plan and billing cycle from order reference
      // Format: ovaso_{plan}_{billingCycle}_{userId}_{timestamp}
      const parts = (orderReference as string).split("_");
      const plan = (parts[1] === "business" ? "business" : "pro") as "pro" | "business";
      const billingCycle = (parts[2] === "annual" ? "annual" : "monthly") as "monthly" | "annual";

      // Upgrade user
      const user = await ctx.runQuery(api.users.getById, { userId: result.userId });
      if (user) {
        await ctx.runMutation(api.users.upgradePlanById, {
          userId: result.userId,
          plan,
          billingCycle,
        });
      }
    } else if (
      eventType === "payment_intent.failed" ||
      eventType === "payment_intent.canceled" ||
      eventType === "payment_intent.expired"
    ) {
      const status = eventType.replace("payment_intent.", "") as
        "failed" | "canceled" | "expired";
      await ctx.runMutation(api.payments.updateStatus, {
        orderReference,
        status,
      });
    } else if (eventType === "payment_intent.processing") {
      await ctx.runMutation(api.payments.updateStatus, {
        orderReference,
        status: "processing",
      });
    }

    return jsonResponse({ received: true });
  }),
});

export default http;
