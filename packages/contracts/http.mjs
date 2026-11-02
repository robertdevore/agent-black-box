import { InputError, MAX_BYTES } from "./run.mjs";
export const json = (value, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function readBody(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new InputError("Content-Type must be application/json", 415);
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    throw new InputError("Maximum receipt size is 1 MiB", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Body required");
  const chunks = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new InputError("Maximum receipt size is 1 MiB", 413);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(out);
  } catch {
    throw new InputError("Invalid UTF-8");
  }
}
export function authorize(request, env) {
  if (!env.OWNER_TOKEN || env.OWNER_TOKEN.length < 32)
    throw new InputError("Owner access is not configured", 503);
  const bearer = request.headers.get("authorization");
  const cookie =
    env.LOCAL_DEV === true
      ? request.headers
          .get("cookie")
          ?.split("; ")
          .find((s) => s.startsWith("blackbox_owner="))
          ?.slice(15)
      : undefined;
  if (bearer !== "Bearer " + env.OWNER_TOKEN && cookie !== env.OWNER_TOKEN)
    throw new InputError("Owner authentication required", 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new InputError("Cross-origin access denied", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new InputError("Cross-site access denied", 403);
}
export function boundary(handler) {
  return async (request, env) => {
    try {
      return await handler(request, env);
    } catch (e) {
      return json(
        {
          error:
            e instanceof InputError
              ? e.message
              : "Request could not be processed",
        },
        e instanceof InputError ? e.status : 500,
      );
    }
  };
}
export class D1Store {
  constructor(db) {
    this.db = db;
  }
  async get(id) {
    const row = await this.db
      .prepare("SELECT body FROM records WHERE id = ?")
      .bind(id)
      .first();
    return row ? JSON.parse(row.body) : null;
  }
  async put(id, value) {
    await this.db
      .prepare("INSERT INTO records(id,body) VALUES(?,?)")
      .bind(id, JSON.stringify(value))
      .run();
  }
  async remove(id) {
    await this.db.prepare("DELETE FROM records WHERE id = ?").bind(id).run();
  }
}
export const store = (env) => env.STORE ?? new D1Store(env.DB);
