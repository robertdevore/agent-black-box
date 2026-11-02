# Launch kit

## 40-second demonstration

The recorded browser capture is `evidence/demo.mp4` (also `evidence/demo.webm`). It contains actual local UI interaction, not generated imagery. No narration is embedded. Use the following captions/voiceover if editing a narrated version; do not hide synthetic labels.

| Time | Shot / action | Caption or narration |
| --- | --- | --- |
| 0–5s | Open directly to the graph; start replay | “See what your AI agent actually did.” |
| 5–12s | Tool calls and file-change nodes advance | “Follow the recorded actions. Inspect the evidence.” |
| 12–19s | Pause on failed test, show error; select retry | “Here’s the failure. Here’s the correction.” |
| 19–26s | Resume through passing test and completion | “This recovery example is synthetic—and labeled.” |
| 26–32s | Switch to recorded Kujo run, inspect real verification | “This one ran for real. Missing evidence stays visible.” |
| 32–38s | Review sanitized record, explicitly approve; open public report | “Share only the record you have reviewed.” |
| 38–42s | Show independent-app strip and attribution | “Composer contracts by Loftwah. Kujo execution receipts. Three independent apps.” |

Lead with the visual replay rather than a slide deck. Include a screenshot of the failure inspector and the actual update test evidence in the technical follow-up. Do not announce a live demo until an authorized HTTPS destination has passed acceptance.

## Technical article draft

### An agent run should be something you can inspect

A final “done” message tells you little about how an agent reached its result. Which commands ran? What changed? Did a test fail first? Is the claimed verification supported by anything you can read?

Agent Black Box turns an execution record into a replay. Open the graph, scrub to an event, and inspect its evidence. Tool calls, file observations, test outcomes, failures and retries remain tied to source identifiers. The viewer never exposes hidden reasoning and never executes imported commands.

The interesting design choice is the boundary between three apps. Run Importer validates, normalizes and redacts receipts into private storage. Replay Studio owns the graph and playback. Receipt Publisher retrieves a reviewed private receipt, verifies the approved digest, and saves a separate read-only public snapshot. They communicate through versioned JSON and Worker service bindings. Their storage and release artifacts remain separate.

**Loftwah’s App Composer supplied the model and actual contracts.** We reused its unchanged manifest/composition validators and promotion guard, and followed its independent Worker/app-owned-data approach. A workerd test sends data through all three services, replaces only Studio executable bytes, and checks that the existing private receipt and public snapshot remain readable. Release digests include the UI assets as well as Worker code.

There is an important limit. Composer's current native editor only admits reviewed applications, and its existing composition CLI targets maintained apps. Agent Black Box therefore has a small explicit local mount/pin adapter. It is not a claim that an arbitrary app can register itself or deploy into Loftwah's installation. Native catalogue admission and cloud promotion remain operator-reviewed work.

Kujo supplies a useful test of evidence honesty. We ran a bounded Kujo program in an isolated Git repository and recorded commands, test outcome, changed file and final verdict with the real RunLedger CLI. RunLedger receipts are not complete traces: commands and tests are manually logged, file-change timestamps are absent, and separate lists do not establish a total order. The adapter says so. It does not invent command outputs or pretend to measure unavailable token usage and cost. A separate failure/recovery fixture is clearly labeled synthetic.

PackWrite compiled the project context through its supported offline manifest seam because no provider key was available. Its generated pack validated without warnings. Kujo Loop ran the test/build/browser gates; an independent review found and helped correct graph geometry, release-asset hashing, date validation and hosted security headers.

To reproduce it, install Node and dependencies, run `npm run dev`, and open the replay. `npm test` exercises contracts and actual Worker bindings; `npm run test:e2e` runs the full import-to-share journey and checks phone layout and accessibility. The architecture is intentionally small enough to read. More provider adapters can be added without changing playback.

The lesson is simple: preserve the difference between observed actions, source assertions and missing evidence. A compelling replay does not need to pretend it knows more than its record.

## X post draft

Watch an agent hit a failing test, inspect the problem, fix it, and replay the recovery.

I built Agent Black Box with App Composer’s real contracts by @loftwah and Kujo RunLedger receipts. Three independent apps: import, replay, publish.

The recovery is labeled synthetic. The Kujo run is real. Missing evidence stays missing.

[Attach actual demo video; add verified source/demo links only after publication.]

## Technical thread draft

1. A final “done” message is a poor execution record. Agent Black Box opens straight into a graph you can replay, scrub and inspect. [video]
2. It has three independent apps: Importer owns private receipts. Studio owns playback. Publisher owns explicitly approved public snapshots. Real data flows over Worker service bindings.
3. Credit to @loftwah and App Composer. I used its actual manifest/composition validators and promotion guard, plus its app-owned-data architecture. Updating Studio in workerd leaves existing receipts readable.
4. An honest boundary: Composer's native catalogue is reviewed and allowlisted. These custom apps use a small local adapter; native registration and cloud promotion aren't being claimed.
5. The successful Kujo example was executed and recorded with RunLedger. That format doesn't contain everything: command outputs, file timing and cross-list ordering can be absent. The UI exposes those gaps.
6. The failure/recovery scenario is synthetic and labeled. Imported commands never run. Text stays inert. Sharing requires reviewing the sanitized record and approving its digest. Redaction isn't infallible.
7. PackWrite compiled the context pack offline; Loop ran the engineering gates. Browser checks cover import → recovery → public report, keyboard controls, phone layout and accessibility. [Add verified source link when available.]

## Feedback for Loftwah — draft, not sent

Used: `validateManifest`, `validateComposition`, `guardPromotion`, manifest contract 1, independent Worker services and app-owned persistence. Source pinned in `vendor/composer/PROVENANCE.json`; tests show real service-binding exchange and an executable component update without data loss.

Worked well: the source/data ownership distinction translated directly to private receipts versus published snapshots. The capability and stale-promotion guard are small and reusable. Your examples make code promotion versus shared current data unusually clear.

Friction: the native stack app list and the current composition command are intentionally bounded to reviewed apps. The generic manifest validator accepts new namespaces, but that does not establish native installability. We documented the distinction and built only a local mount/pin adapter.

Possible improvement: a concise “custom independent app” guide connecting manifest validation, operator-reviewed catalogue admission, mount/service registration, configuration ownership, full-artifact source identity and update acceptance would make this path easier to discover. Include a minimal no-CMS-data Worker example and explicitly state which pieces require installation-owner review.

No upstream bug is asserted. No credentials, native workspace or production Composer deployment was exercised. Demo/source links are pending authorized publication; attach the local screenshots, recording and test evidence for review first.
