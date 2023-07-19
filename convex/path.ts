import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const start = mutation({
  args: { race: v.id("races") },
  handler: async ({ db }, { race }) => {
    const r = await db.get(race);
    return await db.insert("paths", { race, path: [r!.start] });
  },
});

export const get = internalQuery(
  async ({ db }, { path: pathId }: { path: Id<"paths"> }) => {
    const path = await db.get(pathId);
    const race = await db.get(path!.race);
    const target = await db.get(race!.target);
    const articles = await Promise.all(path!.path.map((a) => db.get(a)));
    return {
      target: target!,
      articles: articles as Doc<"articles">[],
    };
  }
);

export const extend = internalMutation(
  async (
    { db },
    { path, next }: { path: Id<"paths">; next: Id<"articles"> }
  ) => {
    console.log("EXTENDING");
    const p = (await db.get(path))!;
    p.path.push(next);
    await db.patch(path, { path: p.path });
  }
);

export const truncate = internalMutation(
  async (
    { db },
    { path, trunc }: { path: Id<"paths">; trunc: Id<"articles"> }
  ) => {
    console.log("TRUNCATING");
    const p = (await db.get(path))!;
    const i = p.path.findIndex((id) => id === trunc);
    if (i < 0) {
      throw new Error(`couldn't find ${trunc}`);
    }
    p.path = p.path.slice(0, i + 1);
    await db.patch(path, { path: p.path });
  }
);
