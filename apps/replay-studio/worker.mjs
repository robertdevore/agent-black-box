import { boundary, json } from "../../packages/contracts/http.mjs";
const handler = boundary(async (request, env) => {
  const path = new URL(request.url).pathname;
  if (path === "/health")
    return json({ app: "replay-studio", version: "1.0.0", contract: 1 });
  if (path.startsWith("/api/runs")) return env.IMPORTER.fetch(request);
  if (path.startsWith("/api/publish") || path.startsWith("/api/public/"))
    return env.PUBLISHER.fetch(request);
  // Trusted asset binding, never a receipt-supplied destination.
  if (path.startsWith("/reports/") || path === "/")
    return env.ASSETS.fetch(
      new Request(new URL("/index.html", request.url), request),
    );
  return env.ASSETS.fetch(request);
});
export default {
  async fetch(request, env) {
    const response = await handler(request, env);
    const headers = new Headers(response.headers);
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Frame-Options", "DENY");
    return new Response(response.body, { status: response.status, headers });
  },
};
