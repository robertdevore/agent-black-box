# Receipt schema v1

Machine-readable shape: [blackbox-run-v1.schema.json](../schemas/blackbox-run-v1.schema.json). Runtime semantic enforcement: `packages/contracts/run.mjs`. Structural schema validation alone cannot enforce sequence relationships, uniqueness, byte/depth budgets, whitespace-only labels or redaction invariants; the importer enforces those too.

Canonical root:

```json
{
  "schema": "blackbox.run/v1",
  "id": "example-run",
  "title": "Verify a change",
  "source": {
    "provider": "your-recorder",
    "receiptId": "source-receipt-001",
    "classification": "recorded"
  },
  "events": [
    {
      "id": "event-1",
      "type": "request",
      "label": "Verify a change",
      "timestamp": null,
      "status": "observed",
      "sourceId": "source-entry-1",
      "evidence": {"task": "Run the existing verification suite."}
    }
  ]
}
```

IDs: ASCII letters, digits, period, underscore, colon and hyphen; first character alphanumeric, maximum 128. An optional source repository is a GitHub HTTPS owner/repository URL. Never use secrets as identifiers. Sensitive identifiers that cannot survive redaction are rejected.

Event types: request, start, decision (only an explicitly recorded public decision/action summary), tool_call, tool_result, file, test, verification, failure, retry, recovery, completion. Status is observed/pass/fail/unknown. Each event has a unique ID, bounded label, timestamp (UTC ISO date or explicit null), source-entry ID and optional evidence object. Hidden chain-of-thought must never be imported.

Tool calls require unique callId values. Results require a matching earlier call. Results may be absent; that becomes a visible evidence gap. A retry requires `retryOf` identifying an earlier failed event. Array order is preserved even for non-monotonic timestamps. A missing timestamp property is invalid; null means unknown. A missing completion remains a visible gap.

Evidence is inert JSON rendered as text. Typical keys: tool, arguments, output, command, exitCode, path, diff, details, attestation. Unknown evidence keys are retained after heuristic redaction; they have no execution or fetching authority. Displayed pass states are source assertions. Nothing infers recovery merely from a later pass; explicit recovery nodes require explicit events.

Metrics: events, tool-call count, distinct file paths (unknown if a file event lacks a path), failed-event count and passing test/verification count. Duration is the difference between first/last event only when every event has a valid non-decreasing timestamp. Tokens and cost are outside v1 and shown unavailable. File counts use unique exact recorded path strings, not platform-specific path canonicalization.

## RunLedger adapter

The inspected native receipt has no schema version. Wrap it explicitly:

```json
{"schema":"runledger/1","receipt":{"id":"...","task_name":"...","commands":[],"tests":[],"changed_files":[],"status":"pass"}}
```

Use the complete real fixture in `fixtures/runledger-success.json`, not this abbreviated shape. Native metadata supplies task/start, manually recorded command calls, manually reported test outcomes, untimed Git file observations and terminal verdict. Start/end commits, model and provider are preserved in event evidence. Command/test list order is retained within each list; their cross-list order is unknown and disclosed. There is no automatic command/result association. Optional native accounting and correlation fields are not imported into v1; no metric is fabricated. The original native fixture remains available for inspection.

`fixtures/recovery.json` is explicitly synthetic. `scripts/record-example.py` executes the recorded fixture task using a temporary repository and real Kujo and RunLedger executables. It removes that temporary repository afterward, saves observed stdout/exit status separately, and replaces only the native local repository path for privacy. These supplied examples contain only demonstration-authored public-safe content, but selecting one still does not authorize publication.

## API persistence

Importer storage IDs are random UUIDs and distinct from source receipt IDs. The digest covers the full canonical sanitized JSON representation. Public snapshots have independent random UUIDs. Neither UUID nor source provenance is authentication. Event evidence is not a cryptographic signature or proof of the truth of source claims.
