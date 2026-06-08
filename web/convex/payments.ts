import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPending = mutation({
  args: {
    userId: v.id("users"),
    orderReference: v.string(),
    amountCents: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, { userId, orderReference, amountCents, currency }) => {
    const now = Date.now();
    return await ctx.db.insert("payments", {
      userId,
      orderReference,
      amountCents,
      currency,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateWithPaymentId = mutation({
  args: {
    paymentDocId: v.id("payments"),
    paymentId: v.string(),
    checkoutUrl: v.string(),
  },
  handler: async (ctx, { paymentDocId, paymentId, checkoutUrl }) => {
    await ctx.db.patch(paymentDocId, {
      paymentId,
      checkoutUrl,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    orderReference: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("canceled"),
      v.literal("expired"),
    ),
  },
  handler: async (ctx, { orderReference, status }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order_reference", (q) => q.eq("orderReference", orderReference))
      .first();

    if (!payment) throw new Error("Payment not found");

    await ctx.db.patch(payment._id, {
      status,
      updatedAt: Date.now(),
    });

    return { userId: payment.userId, status };
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
  },
});
