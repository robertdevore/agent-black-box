import {
  parse,
  validateRun,
  redact,
  VERSION,
  InputError,
} from "../../packages/contracts/run.mjs";
export function fromRunledger(input) {
  if (
    input.schema !== "runledger/1" ||
    !input.receipt ||
    typeof input.receipt !== "object"
  )
    throw new InputError("Unsupported receipt envelope");
  const r = input.receipt;
  if (
    !Array.isArray(r.commands) ||
    !Array.isArray(r.tests) ||
    !Array.isArray(r.changed_files) ||
    !["in_progress", "pass", "partial", "fail", "abandoned"].includes(r.status)
  )
    throw new InputError("Invalid RunLedger receipt");
  const events = [];
  const add = (type, label, timestamp, status, evidence, sourceId) =>
    events.push({
      id: "event-" + events.length,
      type,
      label,
      timestamp: timestamp ?? null,
      status,
      evidence,
      sourceId,
    });
  add(
    "request",
    r.task_name,
    r.created_at,
    "observed",
    {
      task: r.task_name,
      provider: r.provider ?? "Unavailable",
      model: r.model ?? "Unavailable",
      startCommit: r.start_commit ?? "Unavailable",
    },
    "task",
  );
  // Separate RunLedger lists do not establish cross-list chronology. Keep source list order and disclose this.
  r.commands.forEach((c, i) => {
    if (!c || typeof c.text !== "string")
      throw new InputError("Invalid recorded command");
    add(
      "tool_call",
      "Recorded command",
      c.at,
      "observed",
      { command: c.text, attestation: "Manually logged; output not captured" },
      "command-" + i,
    );
    events.at(-1).callId = "command-" + i;
  });
  r.tests.forEach((t, i) => {
    if (
      !t ||
      !["pass", "fail", "skip", "unknown"].includes(t.status) ||
      typeof t.name !== "string" ||
      typeof t.details !== "string"
    )
      throw new InputError("Invalid recorded test");
    add(
      "test",
      t.name,
      t.at,
      t.status === "pass" ? "pass" : t.status === "fail" ? "fail" : "unknown",
      { details: t.details, attestation: "Manually logged test outcome" },
      "test-" + i,
    );
  });
  r.changed_files.forEach((f, i) => {
    if (typeof f !== "string") throw new InputError("Invalid changed file");
    add(
      "file",
      "Changed file",
      null,
      "observed",
      {
        path: f,
        attestation: "Git end-state; change time and diff unavailable",
      },
      "file-" + i,
    );
  });
  if (r.status !== "in_progress")
    add(
      "completion",
      r.status === "pass" ? "Run completed" : "Run ended: " + r.status,
      r.updated_at,
      r.status === "pass" ? "pass" : r.status === "fail" ? "fail" : "unknown",
      {
        verdict: r.verdict ?? "Unavailable",
        endCommit: r.end_commit ?? "Unavailable",
      },
      "verdict",
    );
  return {
    schema: VERSION,
    id: r.id,
    title: r.task_name,
    source: {
      provider: "runledger",
      receiptId: r.id,
      classification: "recorded",
      repository: "https://github.com/kujolang/runledger",
    },
    events,
  };
}
export function normalize(raw) {
  const input = parse(raw);
  const run = validateRun(
    input.schema === "runledger/1" ? fromRunledger(input) : input,
  );
  const sanitized = redact(run);
  // Reject redaction of structural identifiers rather than silently breaking links or merging IDs.
  return validateRun(sanitized);
}
