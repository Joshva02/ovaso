import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let segment = "";
    for (let i = 0; i < 8; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `ovaso_${segments.join("_")}`;
}

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }) => {
    const key = generateApiKey();
    const id = await ctx.db.insert("apiKeys", {
      userId,
      key,
      name,
      isActive: true,
      createdAt: Date.now(),
      totalRequests: 0,
    });
    return { id, key };
  },
});

export const revoke = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    await ctx.db.patch(keyId, { isActive: false });
  },
});

export const regenerate = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const newKey = generateApiKey();
    await ctx.db.patch(keyId, {
      key: newKey,
      createdAt: Date.now(),
      totalRequests: 0,
    });
    return newKey;
  },
});

export const validate = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!apiKey || !apiKey.isActive) return null;

    const user = await ctx.db.get(apiKey.userId);
    if (!user) return null;

    return {
      userId: apiKey.userId,
      plan: user.plan,
      keyId: apiKey._id,
    };
  },
});

export const trackUsage = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const apiKey = await ctx.db.get(keyId);
    if (!apiKey) return;
    await ctx.db.patch(keyId, {
      totalRequests: apiKey.totalRequests + 1,
      lastUsedAt: Date.now(),
    });
  },
});
