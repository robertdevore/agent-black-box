import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import importer from "../apps/run-importer/worker.mjs";
import publisher from "../apps/receipt-publisher/worker.mjs";
import studio from "../apps/replay-studio/worker.mjs";
const port = Number(process.env.PORT || 4173),
  token = crypto.randomUUID() + crypto.randomUUID();
const data = resolve(process.env.BLACKBOX_DATA || ".private/data");
await mkdir(data, { recursive: true, mode: 0o700 });
function database(name) {
  const db = new DatabaseSync(resolve(data, name + ".sqlite"));
  db.exec(
    "CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,body TEXT NOT NULL)",
  );
  return {
    async get(id) {
      const r = db.prepare("SELECT body FROM records WHERE id=?").get(id);
      return r ? JSON.parse(r.body) : null;
    },
    async put(id, v) {
      db.prepare("INSERT INTO records VALUES(?,?)").run(id, JSON.stringify(v));
    },
    async remove(id) {
      db.prepare("DELETE FROM records WHERE id=?").run(id);
    },
  };
}
const importerEnv = {
  OWNER_TOKEN: token,
  LOCAL_DEV: true,
  STORE: database("run-importer"),
};
const IMPORTER = { fetch: (r) => importer.fetch(r, importerEnv) };
const publisherEnv = {
  OWNER_TOKEN: token,
  LOCAL_DEV: true,
  STORE: database("receipt-publisher"),
  IMPORTER,
};
const PUBLISHER = { fetch: (r) => publisher.fetch(r, publisherEnv) };
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const ASSETS = {
  async fetch(r) {
    let path = new URL(r.url).pathname;
    let file;
    file = resolve("dist/replay-studio/public", "." + path);
    if (!file.startsWith(resolve("dist/replay-studio/public") + "/"))
      return new Response("Not found", { status: 404 });
    try {
      return new Response(await readFile(file), {
        headers: {
          "Content-Type":
            contentTypes[extname(file)] || "application/octet-stream",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};
const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};
http
  .createServer(async (req, res) => {
    try {
      if (
        req.headers.host !== `127.0.0.1:${port}` &&
        req.headers.host !== `localhost:${port}`
      ) {
        res.writeHead(403);
        return res.end("Invalid host");
      }
      const request = new Request("http://" + req.headers.host + req.url, {
        method: req.method,
        headers: req.headers,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: req, duplex: "half" }
          : {}),
      });
      const result = await studio.fetch(request, {
        IMPORTER,
        PUBLISHER,
        ASSETS,
      });
      res.writeHead(result.status, {
        ...Object.fromEntries(result.headers),
        ...security,
        ...(req.url === "/"
          ? {
              "Set-Cookie": `blackbox_owner=${token}; HttpOnly; SameSite=Strict; Path=/`,
            }
          : {}),
      });
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Agent Black Box: http://127.0.0.1:" + port),
  );
