# run-importer

Owns private canonical receipts and the RunLedger adapter. POST/GET /api/runs require owner authentication. DB is private and app-owned.

Build from repository root: `npm run build --workspace @agent-black-box/run-importer`.

The app manifest uses Composer contract 1. Deployment is explicit; see ../../docs/DEPLOYMENT.md. Data version 1 migrations belong to this application. No remote repository or Cloudflare resource is created by building.
