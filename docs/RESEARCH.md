# Source discovery — 2 November 2026

Research preceded implementation. Sources were inspected directly and remote HEADs checked with `git ls-remote`. Current documentation was read alongside code; release names alone were not used as capability evidence.

## App Composer

[composer.loftwah.com](https://composer.loftwah.com/) links to [loftwah/app-composer](https://github.com/loftwah/app-composer). Inspected commit: `5289956f8efba5daefa1de78e1680f5e1c65666a`. See `vendor/composer/PROVENANCE.json` for the exact reused MIT source. Read README, ARCHITECTURE, docs/operator-reference.md, docs/STATUS.md, docs/creator-stacks/demo-stacks.md, scripts/compose.mjs, scripts/contracts.mjs, src/lib/stacks.mjs, src/worker.ts, wrangler.jsonc and the Guestbook manifest.

- **Creation:** Get Ready verifies a selected workspace; Init emits a portable specification. Maintained recipes include `pnpm init:hello`, `init:site`, `init:paperwork` and `init:launch-kit`. These are bounded recipes, not a general arbitrary-app generator. We authored the three custom Workers and used Composer's manifest/validation layer; we did not run an unsupported generator.
- **Composition:** independent Worker services, source pins, app-owned data, generic provider APIs and explicit promotion. Guestbook and Showcase demonstrate real API exchange and separately pinned mounted services. This application follows that boundary and executes service-binding exchange in workerd.
- **Discovery:** catalogue descriptions live in EmDash D1/R2; reviewed app lists are explicit. `validateManifest` accepts our namespaces, while `STACK_APPS` and the production `compose` CLI are restricted to maintained apps. Validation does not register an app with the native editor.
- **Configuration:** versioned manifests declare supported fields. Stack documents hold presentation/configuration, not app records or secrets. Independent apps retain their state. Our manifests declare no Composer-editable settings; Wrangler configuration and storage remain app-owned.
- **Deploy/update:** exact reviewed executable pins are promoted; independently updating upstream does not update the mounted consumer automatically. Code rollback does not restore data. Native production scripts require clean pushed sources, selected account and verified authority. We implement a local package-pin adapter and use actual `guardPromotion`; no native production script or cloud write ran.
- **Implemented versus unsupported here:** validators, app-owned data and Worker composition are exercised. Native editor admission of these three new IDs, cloud provisioning, remote promotion and arbitrary registered-app installation are not exercised. General custom apps require an operator-reviewed integration; no automatic registry installation is claimed.
- **External APIs:** app-owned provider API boundaries; a separately qualified trusted-host incident transport exists. Its credentials and destinations are host-selected. This project uses fixed service bindings; imports cannot select network destinations.
- **Examples studied:** Guestbook/Here-there, Showcase/Linkarooie, Hello, Carry/forward; fictional Trail Notes and Launch Board native stack documents. Shared-instance semantics are explicit. Our project does not claim use of their privileged configuration, membership or provider features.

The production status document has dated evidence and caveats; its historical test totals are not Agent Black Box test results.

## Kujo

| Repository / inspected HEAD | Verified interface | Use here |
| --- | --- | --- |
| [runledger](https://github.com/kujolang/runledger) `ab0ec5d2edb7ffd913f48d092aa6fc17cab58d13` | `src/record.kujo`; `start`, `command`, `test`, `finish`, `show --json`; commands have `at,text`, tests `at,name,status,details`; unversioned native record | Executed real CLI; explicit `runledger/1` import envelope; no invented tool outcomes |
| [watchdog](https://github.com/kujolang/watchdog) `7a0bd9a63d68421831ed66d6eed29805c48e1b24` | `GET /telemetry/v2/jsonl`, policy-approved records with original producer identity and monotonic ingest sequence; `/api/export?format=jsonl` is legacy | Researched; no native adapter shipped or live API claimed |
| [dispatch](https://github.com/kujolang/dispatch) `18b5c737a73904ae942f0bd1c3baa1f77c2bfb40` | `src/core/trace.kujo`, `report.kujo`; run/trace IDs, events, OTEL spans, persisted report/state; offline mode explicitly marked | Researched; correlation is not execution permission; no runtime rewritten |
| [workcell](https://github.com/kujolang/workcell) `189d7ab6e975301a0e5100b65e8ad3fe4a584573` | stable v1 execution receipts/manifests, `run`, `verify`; v2alpha1 provider-neutral contract separately experimental | Researched; no container/remote provider run claimed |
| [shipcheck](https://github.com/kujolang/shipcheck) `7eedd9e02d8730d65e06e16f4984d909d23539bc` | `schemas/shipcheck-report.schema.json`; tool/version/summary/checks, integer pass flags | Researched; no ShipCheck certification implied |
| [packwrite](https://github.com/kujolang/packwrite) `b8467535c74263abc59fd3f48028b67d42cd7e68` | manifest compiler, `init`, `validate`, `prompt codex-review`, documented offline response seam | Executed, validated 0 warnings; offline agent-authored manifest, no provider generation |
| [kujo-workflows](https://github.com/kujolang/kujo-workflows) `1d25503515f03a4c0d4457b327686d92ccc9c68a` | `loop-engineering/scripts/init-repo-loop.sh`, `run-workflow.sh --config`; actual initializer emits `.loop-engineering/loop.yml` | Primary bounded engineering gates and evidence |
| [kujo](https://github.com/kujolang/kujo) remote `2c53503ac037bbeeca87900909872a71dd205bd5` | language CLI `check`, `run`; local built runtime 1.9.0 from checkout `66a59e4e9abdfcacb783c80d6d4bd6fd842e774e` | Executed arithmetic verification in isolated temporary Git repository |

The installed default runtime reported 1.5.0; PackWrite successfully ran with that binary. RunLedger ran with the available built Kujo 1.9.0 binary, not an assumed minimum-compatible installed launcher. The RunLedger skill's older statement that commands/tests are reserved is superseded by the inspected CLI/source, which implements both commands.

## PackWrite and Loop evidence

Executed using absolute launchers and explicit `KUJO`:

```sh
packwrite doctor --strict
PACKWRITE_FAKE_RESPONSE_FILE="$PWD/evidence/packwrite-manifest.json" packwrite init MEGA_PROMPT.md
packwrite validate
packwrite prompt codex-review
/path/to/kujo-workflows/loop-engineering/scripts/init-repo-loop.sh
/path/to/kujo-workflows/loop-engineering/scripts/run-workflow.sh --config .loop-engineering/loop.yml
```

Doctor identified the missing provider key. The documented offline seam compiled the authored context manifest; stdout's generic “Requesting model output” line does **not** mean a provider was called. Manifest paths required the `agent/` prefix and the validator required structured phase/handoff headings; these were corrected before a passing pack was used. `agent/MASTER.md` carries requirements; phase files, TODO and reviewer prompt carry handoff.

Loop's first browser gate failed because Chromium installation was not yet complete. After installation and fixes all configured gates passed. The current harness restarts at iteration 001 per invocation and overwrites that iteration directory; its ledger retains both verdicts. Later milestones use separate configuration directories to preserve their complete evidence. This limitation is recorded rather than presenting overwritten evidence as an immutable history.
