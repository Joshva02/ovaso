import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("business")),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    checksUsed: v.optional(v.number()),
    checksResetAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    key: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    totalRequests: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_user_id", ["userId"]),

  payments: defineTable({
    userId: v.id("users"),
    orderReference: v.string(),
    paymentId: v.optional(v.string()),
    amountCents: v.number(),
    currency: v.string(),
    plan: v.optional(v.union(v.literal("pro"), v.literal("business"))),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("canceled"),
      v.literal("expired"),
    ),
    checkoutUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order_reference", ["orderReference"])
    .index("by_user_id", ["userId"])
    .index("by_payment_id", ["paymentId"]),
});
