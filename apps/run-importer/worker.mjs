import { normalize } from "./normalize.mjs";
import { digest, gaps, metrics } from "../../packages/contracts/run.mjs";
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
      return json({ app: "run-importer", version: "1.0.0", contract: 1 });
    authorize(request, env);
    if (path === "/api/runs" && request.method === "POST") {
      const run = normalize(await readBody(request));
      const id = crypto.randomUUID();
      const hash = await digest(run);
      await store(env).put(id, { run, digest: hash });
      return json(
        { id, digest: hash, run, gaps: gaps(run), metrics: metrics(run) },
        201,
      );
    }
    const match = path.match(/^\/api\/runs\/([a-f0-9-]{36})$/);
    if (match && request.method === "GET") {
      const saved = await store(env).get(match[1]);
      return saved
        ? json({
            ...saved,
            id: match[1],
            gaps: gaps(saved.run),
            metrics: metrics(saved.run),
          })
        : json({ error: "Receipt not found" }, 404);
    }
    return json({ error: "Not found" }, 404);
  }),
};
