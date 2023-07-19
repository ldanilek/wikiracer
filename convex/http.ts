import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { httpRouter } from "convex/server";
import { Id } from "./_generated/dataModel";

type Link = {
  name: string;
  url: string;
};

const extendHandler = httpAction(async ({ runMutation }, request) => {
  const j = await request.text();
  console.log(j);
  const url = new URL(request.url);
  const urlPath = url.searchParams.get("path") as Id<"paths">;
  const next = url.searchParams.get("next") as Id<"articles">;

  await runMutation(internal.path.extend, { path: urlPath, next });

  const base =
    // eslint-disable-next-line
    (process.env.CONVEX_SITE_URL as string) + "/race?path=" + urlPath;
  return new Response(null, {
    headers: { Location: base },
    status: 301,
  });
});

const truncateHandler = httpAction(async ({ runMutation }, request) => {
  const url = new URL(request.url);
  const urlPath = url.searchParams.get("path") as Id<"paths">;
  const trunc = url.searchParams.get("trunc") as Id<"articles">;

  await runMutation(internal.path.truncate, { path: urlPath, trunc });

  const base =
    // eslint-disable-next-line
    (process.env.CONVEX_SITE_URL as string) + "/race?path=" + urlPath;
  return new Response(null, {
    headers: { Location: base },
    status: 301,
  });
});

const parseLinks = async (wiki: Response) => {
  const links: Link[] = [];
  const text = await wiki.text();

  const regex = /<a href="(\/wiki\/[^"]*)"[^>]*>([^<]*)<\/a>/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    //console.log(`URL: ${match[1]}, Text: ${match[2]}`);
    links.push({
      name: match[2],
      url: "https://en.wikipedia.org" + match[1],
    });
  }
  return links;
};

type Article = {
  _id: Id<"articles">;
  name: string;
};

const pathHandler = httpAction(async ({ runQuery, runMutation }, request) => {
  const url = new URL(request.url);
  const urlPath = url.searchParams.get("path") as Id<"paths">;

  const path = await runQuery(internal.path.get, {
    path: urlPath,
  });
  const pathArticles = path.articles;
  const current = pathArticles[pathArticles.length - 1];
  const currentURL = new URL(current.url);
  console.log(currentURL);
  const wiki = await fetch(currentURL);
  console.log("fetched", current.url, wiki.status);
  if (wiki.status > 300) {
    return wiki;
  }
  const links = await parseLinks(wiki);
  const articles: Article[] = [];
  for (let i = 0; i < links.length; i += 100) {
    const ids = await runMutation(internal.article.multiUpsert, {
      links: links.slice(i, Math.min(i + 100, links.length)),
    });
    for (let j = i; j < i + 100 && j < links.length; j++) {
      articles.push({
        name: links[j].name,
        _id: ids[j - i],
      });
    }
  }
  // eslint-disable-next-line
  const base = process.env.CONVEX_SITE_URL as string;
  const baseExtend = base + "/extend";
  const articleList = articles.map(
    ({ name, _id }) =>
      `<li>
        <form action='${baseExtend}' method='POST'>
        <input type="hidden" name="path" value="${urlPath}" />
        <input type="hidden" name="next" value="${_id}" />
        <button type="submit">${name}</button>
        </form>
      </li>`
  );
  const baseTruncate = base + "/truncate?path=" + urlPath + "&";
  const pathList = pathArticles.map(
    ({ _id, name }) => `<a href='${baseTruncate}trunc=${_id}'>${name}</a>`
  );

  return new Response(
    `<html>
  <body style="background-color: lightblue;">
  <iframe src='${current.url}' width='100%'></iframe>
  <p>Race to <a href='${path.target.url}'>${path.target.name}</a></p>
  <p>You are at ${pathList.join(" => ")}</p>
  <p>Go to:</p>
  <ul>
    ${articleList.join("\n")}
  </ul>
  
  </body>
  </html>`,
    {
      headers: { "Content-Type": "text/html" },
      status: 200,
    }
  );
});

const http = httpRouter();

http.route({
  path: "/race",
  method: "GET",
  handler: pathHandler,
});
http.route({
  path: "/extend",
  method: "POST",
  handler: extendHandler,
});
http.route({
  path: "/truncate",
  method: "POST",
  handler: truncateHandler,
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
