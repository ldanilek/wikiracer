import { query, internalMutation } from "./_generated/server";

export const list = query(async ({ db }) => {
  return await db.query("articles").collect();
});

type Link = {
  name: string;
  url: string;
};

export const multiUpsert = internalMutation(async ({ db }, {links}: {links: Link[]}) => {
  const ids = [];
  for (const link of links) {
    const existing = await db.query("articles").withIndex("by_url", q => q.eq('url', link.url)).unique();
    let id;
    if (!existing) {
      id = await db.insert("articles", link);
    } else {
      id = existing._id;
    }
    ids.push(id);
  }
  return ids;
});