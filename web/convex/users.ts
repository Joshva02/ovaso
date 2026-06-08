import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const planValidator = v.union(v.literal("free"), v.literal("pro"), v.literal("business"));
const billingCycleValidator = v.union(v.literal("monthly"), v.literal("annual"));

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      plan: "free",
      checksUsed: 0,
      checksResetAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const upgradePlan = mutation({
  args: { clerkId: v.string(), plan: planValidator },
  handler: async (ctx, { clerkId, plan }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { plan });
  },
});

export const upgradePlanById = mutation({
  args: {
    userId: v.id("users"),
    plan: planValidator,
    billingCycle: v.optional(billingCycleValidator),
  },
  handler: async (ctx, { userId, plan, billingCycle }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, {
      plan,
      billingCycle,
      checksUsed: 0,
      checksResetAt: Date.now(),
    });
  },
});
