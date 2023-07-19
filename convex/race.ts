import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query(async ({ db }) => {
  const races = await db.query("races").collect();
  const startArticles = await Promise.all(
    races.map((race) => db.get(race.start))
  );
  const targetArticles = await Promise.all(
    races.map((race) => db.get(race.target))
  );
  return races.map((race, i) => {
    return {
      _id: race._id,
      start: startArticles[i],
      target: targetArticles[i],
    };
  });
});

export const make = mutation({
  args: { start: v.id("articles"), target: v.id("articles") },
  handler: async ({ db }, { start, target }) => {
    await db.insert("races", { start, target });
  },
});
