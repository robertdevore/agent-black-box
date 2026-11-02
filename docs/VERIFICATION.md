# Verification and acceptance

> Initial local-build record. For the revised video and current publication process, see `videos/composer-siren/README.md` and `docs/PUBLISHING.md`.

Executed locally on macOS, Node 26.12.1. Exact output lives in `.loop-engineering/milestones/release/iterations/001/eval.log`; browser machine results in `evidence/browser-results.json`. No unexecuted cloud checks count as passing.

**Final result: 17 Node/runtime tests and 5 Chromium browser tests passed; build and whitespace gates passed.**

## Gates

- PackWrite: real `init`, `validate`, reviewer prompt. Validation passed with zero warnings. Offline response manifest explicitly selected because provider credentials were absent.
- Loop: initializer/config driver executed. Unit/runtime, build, browser and whitespace gates. Early browser launch failed while Chromium was still downloading; later runs passed. Different config directories preserve final milestone evidence.
- Node suite: importer schema/order/duplicates/unknown timestamps/tool relationships/provenance/redaction; deterministic playback; authentication/approval/stale digest/revocation; actual Composer validators and full-asset release hashing; hosted security headers; real Worker bindings and D1 persistence across Studio update.
- Browser suite: full import-to-public-report journey in a separate anonymous context; keyboard/reduced motion/scrubber; 1440px and 390px layouts, axe WCAG A/AA with zero violations; genuine RunLedger example; script-injection text; correct graph turns; 1,000-event bounded rendering.
- Build: independent Worker bundles and Studio assets produced with locked dependencies.
- Visual inspection: `evidence/replay-1440.png`, `replay-390.png`, `public-report.png`; actual browser recording `demo.webm` and encoded `demo.mp4` (40.92 seconds).
- Genuine execution: Kujo 1.9.0 `check` and `run` on a temporary arithmetic program; RunLedger 1.2.1 `start/command/test/finish/show --json`. Exact stdout retained. No model costs or token counts invented.

## Acceptance matrix

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Current Composer researched and correctly used | Pass locally: unchanged real validators and independent Worker model. Native registration not claimed. |
| 2 | PackWrite executed | Pass using supported offline seam; provider generation unavailable. |
| 3 | Loop engineering | Pass: configured gates and per-milestone evidence. |
| 4 | Three independently maintained components | Pass: separate source/package/manifest/config/artifacts. One monorepo, not separate remote owners. |
| 5 | Real data exchange | Pass: service-binding integration in workerd. |
| 6 | Genuine trace import/replay | Pass: actual bounded RunLedger execution, manual logging gaps disclosed. |
| 7 | Failure/recovery | Pass: explicitly synthetic fixture. |
| 8 | Graph/timeline synchronization | Pass: browser interaction and sequence geometry. |
| 9 | Event evidence | Pass: commands, outputs, diffs, source IDs and gaps. |
| 10 | Approved sanitized sharing | Pass locally: explicit approval, anonymous read, revocation. Internet sharing blocked pending hosting authorization. |
| 11 | Responsive/accessibility | Pass in Chromium at tested sizes and axe/keyboard/reduced-motion checks; broader devices unverified. |
| 12 | Automated tests | Pass; authoritative totals in final Loop log/browser results. |
| 13 | Independent component update | Pass in workerd with unchanged existing private/public records. Cloud promotion unverified. |
| 14 | Build/run documentation | Pass locally; hosting runbook prepared but not executed. |
| 15 | Promotional/feedback materials | Pass: actual video, screenshots, article, social thread, maintainer draft. Not sent or posted. |

## Remaining boundaries

No selected Git remote, authorized cloud account/destination, or native Composer catalogue approval. No live demo URL or push success. No Watchdog/Dispatch/Workcell-specific adapter. Source declarations are not authenticated provenance; imported “recorded” and “pass” are claims. Heuristic redaction requires human review. Tokens/cost outside canonical v1 remain unavailable. No production multi-tenant authorization, retention policy or cloud rollback test.

The native Composer restriction is a supported-platform boundary, not an integration bug. Loop's repeated invocation evidence overwrite is a separate unresolved upstream finding preserved in SignalBox; milestone configuration directories avoid it in the final local evidence.
