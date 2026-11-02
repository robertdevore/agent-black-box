import {
  digest,
  redact,
  validateRun,
  parse,
  InputError,
  gaps,
  metrics,
} from "../../packages/contracts/run.mjs";
import {
  authorize,
  boundary,
  json,
  readBody,
  store,
} from "../../packages/contracts/http.mjs";
export default {
  fetch: boundary(async (request, env) => {
    const path = new URL(request.url).pathname;
    if (path === "/health")
      return json({ app: "receipt-publisher", version: "1.0.0", contract: 1 });
    const match = path.match(/^\/api\/public\/([a-f0-9-]{36})$/);
    if (match && request.method === "GET") {
      const saved = await store(env).get(match[1]);
      return saved
        ? json({ ...saved, metrics: metrics(saved.run), gaps: gaps(saved.run) })
        : json({ error: "Public report not found" }, 404);
    }
    authorize(request, env);
    if (match && request.method === "DELETE") {
      await store(env).remove(match[1]);
      return json({ revoked: true });
    }
    if (path !== "/api/publish" || request.method !== "POST")
      return json({ error: "Not found" }, 404);
    const input = parse(await readBody(request));
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).sort().join(",") !== "approved,digest,receiptId" ||
      input.approved !== true ||
      !/^[a-f0-9-]{36}$/.test(input.receiptId) ||
      !/^[a-f0-9]{64}$/.test(input.digest)
    )
      throw new InputError(
        "Explicit approval of the reviewed receipt digest is required",
        403,
      );
    const response = await env.IMPORTER.fetch(
      new Request("https://importer/api/runs/" + input.receiptId, {
        headers: { Authorization: "Bearer " + env.OWNER_TOKEN },
      }),
    );
    if (!response.ok) throw new InputError("Private source unavailable", 409);
    const source = await response.json();
    if (source.digest !== input.digest)
      throw new InputError("Receipt changed; review again", 409);
    const run = redact(validateRun(source.run));
    const id = crypto.randomUUID();
    await store(env).put(id, {
      id,
      run,
      digest: await digest(run),
      publishedAt: new Date().toISOString(),
      disclosure:
        "Explicitly approved sanitized snapshot. Redaction is heuristic; source claims are not independent certification.",
    });
    return json({ id, url: "/reports/" + id }, 201);
  }),
};
