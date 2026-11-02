# Deployment runbook — prepared, not executed

Publishing this source repository does not create cloud resources or a hosted application. The local server is usable now. Select an authorized Cloudflare account and hostname before deployment. No paid services are required by the local prototype. Source publication uses a clean snapshot; see PUBLISHING.md.

## Reproducible local release

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:e2e
node scripts/compose.mjs --promote-local
```

The complete artifact tree, including Studio UI and fixtures, contributes to each component digest. `composition.lock.json` records these reviewed local pins. It does not prove a remote deployment.

## After explicit Cloudflare authorization

Use the selected account's existing Wrangler authentication; do not reuse Loftwah's account IDs, destinations or credentials. All commands below are operator actions, **not executed evidence**.

1. Create two D1 databases with the selected account:

```sh
npx wrangler d1 create blackbox-run-importer
npx wrangler d1 create blackbox-receipt-publisher
```

2. Put the returned database IDs in the respective `apps/*/wrangler.jsonc` files, replacing `SET_AFTER_AUTHORIZED_PROVISIONING`. Set the selected account explicitly in all three profiles. Retain `workers_dev:false` and no public routes on importer and publisher.
3. Apply each app's own schema:

```sh
npx wrangler d1 migrations apply blackbox-run-importer --remote --config apps/run-importer/wrangler.jsonc
npx wrangler d1 migrations apply blackbox-receipt-publisher --remote --config apps/receipt-publisher/wrangler.jsonc
```

4. Set the same strong, operator-managed owner token on the two private services. Use Wrangler's interactive secret prompt; never write it into source, logs or a shell argument:

```sh
npx wrangler secret put OWNER_TOKEN --config apps/run-importer/wrangler.jsonc
npx wrangler secret put OWNER_TOKEN --config apps/receipt-publisher/wrangler.jsonc
```

5. Review the built artifact digests and deployment dry runs, then deploy importer, publisher and Studio in order:

```sh
npx wrangler deploy --dry-run --config apps/run-importer/wrangler.jsonc
npx wrangler deploy --dry-run --config apps/receipt-publisher/wrangler.jsonc
npx wrangler deploy --dry-run --config apps/replay-studio/wrangler.jsonc
npx wrangler deploy --config apps/run-importer/wrangler.jsonc
npx wrangler deploy --config apps/receipt-publisher/wrangler.jsonc
npx wrangler deploy --config apps/replay-studio/wrangler.jsonc
```

These deploy profiles build Worker source through Wrangler and use the previously built Studio assets. Re-run the full build immediately before deployment; review source and lock together. Future production automation should enforce deployed version IDs against reviewed artifacts; the current local pin adapter does not claim provider-level pin enforcement.

6. Open Studio's returned HTTPS URL. Public demo fixtures are read-only until owner authentication. Enter the token through Import receipt, import one of the public-safe fixture files, inspect all evidence, explicitly publish, and open the report in an unauthenticated browser. Verify private API 401 responses, importer/publisher direct inaccessibility, CSP, service health, mobile UI and revocation. Record actual Cloudflare Worker versions and DNS/route results before declaring live acceptance.

## Independent update

Build only the selected component, validate manifests/promotion, run compatibility tests and review its full artifact digest. For a code-only Studio update, importer/publisher databases and bindings remain unchanged. `tests/worker-runtime.test.mjs` proves this locally with actual executable replacement. Cloud update/rollback verification remains pending authorized hosting. Code rollback never restores deleted snapshots or storage migrations.

## Native Composer installation

The current upstream `compose` CLI is pair-specific and native `STACK_APPS` is allowlisted. Do not run `pnpm compose --apply` with these custom IDs. Ask the installation maintainer to review app manifests, mounts, service identities, data boundaries and configuration; then add an explicit native catalogue/mount integration. Until that work is reviewed, describe this as a Composer-contract integration with a local Worker adapter, not an installed native Composer stack.

## Remote source

Local Git history is ready. Once an existing authorized remote is supplied:

```sh
git remote add origin AUTHORIZED_REPOSITORY_URL
git push -u origin main
```

No remote URL is invented, and no remote repository is created by the build scripts.
