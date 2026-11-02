# receipt-publisher

Owns approved immutable public snapshots. Publication requires owner authentication, approved=true and matching private receipt digest. Public reads use a separate DB.

Build from repository root: `npm run build --workspace @agent-black-box/receipt-publisher`.

The app manifest uses Composer contract 1. Deployment is explicit; see ../../docs/DEPLOYMENT.md. Data version 1 migrations belong to this application. No remote repository or Cloudflare resource is created by building.
