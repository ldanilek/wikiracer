import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  articles: defineTable({
    name: v.string(),
    url: v.string(),
  }).index("by_url", ["url"]),
  races: defineTable({
    start: v.id("articles"),
    target: v.id("articles"),
  }),
  paths: defineTable({
    race: v.id("races"),
    path: v.array(v.id("articles")),
  }),
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
});
