export const VERSION = "blackbox.run/v1";
export const MAX_BYTES = 1048576;
export const TYPES = [
  "request",
  "start",
  "decision",
  "tool_call",
  "tool_result",
  "file",
  "test",
  "verification",
  "failure",
  "retry",
  "recovery",
  "completion",
];
export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message) => {
  throw new InputError(message);
};
const obj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const id = (x) =>
  typeof x === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(x);
const text = (x, n = 20000) => typeof x === "string" && x.length <= n;
function keys(x, allowed) {
  if (!obj(x) || Object.keys(x).some((k) => !allowed.includes(k)))
    fail("Unknown or invalid object fields");
}
function timestamp(x) {
  if (x === null) return true;
  if (
    typeof x !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(x) ||
    !Number.isFinite(Date.parse(x))
  )
    return false;
  return new Date(x).toISOString().slice(0, 19) === x.slice(0, 19);
}
export function safeTree(x, depth = 0) {
  if (typeof x === "number" && !Number.isFinite(x)) fail("Non-finite number");
  if (depth > 16) fail("Input nesting exceeds 16 levels");
  if (typeof x === "string" && x.length > 100000)
    fail("Text exceeds 100000 characters");
  if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) {
      if (["__proto__", "constructor", "prototype"].includes(k))
        fail("Unsafe object key");
      safeTree(v, depth + 1);
    }
}
export function parse(textInput) {
  if (new TextEncoder().encode(textInput).length > MAX_BYTES)
    throw new InputError("Maximum receipt size is 1 MiB", 413);
  let value;
  try {
    value = JSON.parse(textInput);
  } catch {
    fail("Invalid JSON");
  }
  safeTree(value);
  return value;
}
export function validateRun(r) {
  keys(r, ["schema", "id", "title", "source", "events"]);
  if (r.schema !== VERSION) fail("Unsupported schema version");
  if (!id(r.id) || !text(r.title, 180) || !r.title.trim())
    fail("Invalid run identity or title");
  keys(r.source, ["provider", "receiptId", "classification", "repository"]);
  if (
    !text(r.source.provider, 80) ||
    !r.source.provider.trim() ||
    !id(r.source.receiptId) ||
    !["recorded", "synthetic"].includes(r.source.classification)
  )
    fail("Invalid provenance");
  if (
    r.source.repository !== undefined &&
    !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(
      r.source.repository,
    )
  )
    fail("Repository must be a public GitHub repository URL");
  if (!Array.isArray(r.events) || !r.events.length || r.events.length > 1000)
    fail("Expected 1–1000 events");
  const seen = new Map();
  for (const e of r.events) {
    keys(e, [
      "id",
      "type",
      "label",
      "timestamp",
      "status",
      "evidence",
      "sourceId",
      "callId",
      "retryOf",
    ]);
    if (!id(e.id) || seen.has(e.id)) fail("Invalid or duplicate event ID");
    if (
      !TYPES.includes(e.type) ||
      !text(e.label, 180) ||
      !e.label.trim() ||
      !timestamp(e.timestamp) ||
      !["observed", "pass", "fail", "unknown"].includes(e.status) ||
      !id(e.sourceId)
    )
      fail("Invalid event fields");
    if (
      e.evidence !== undefined &&
      (!obj(e.evidence) || JSON.stringify(e.evidence).length > 100000)
    )
      fail("Invalid event evidence");
    if (e.callId !== undefined && !id(e.callId)) fail("Invalid call ID");
    if (
      e.type === "tool_result" &&
      (!e.callId ||
        ![...seen.values()].some(
          (v) => v.type === "tool_call" && v.callId === e.callId,
        ))
    )
      fail("Tool result needs a preceding matching call");
    if (
      e.type === "tool_call" &&
      (!e.callId ||
        [...seen.values()].some(
          (v) => v.type === "tool_call" && v.callId === e.callId,
        ))
    )
      fail("Tool calls need distinct call IDs");
    if (
      e.retryOf !== undefined &&
      (!seen.has(e.retryOf) || seen.get(e.retryOf).status !== "fail")
    )
      fail("Retry must reference an earlier failed event");
    if (e.type === "retry" && !e.retryOf) fail("Retry relationship required");
    seen.set(e.id, e);
  }
  return r;
}
// Heuristics only: review the complete sanitized snapshot before sharing.
export function redact(value) {
  const replace = (s) =>
    s
      .replace(
        /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
        "[REDACTED PRIVATE KEY]",
      )
      .replace(
        /\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,}|AKIA[A-Z0-9]{16})\b/g,
        "[REDACTED]",
      )
      .replace(/\bBearer\s+[^\s"'<>]+/gi, "Bearer [REDACTED]")
      .replace(
        /((?:api[_-]?key|password|secret|access[_-]?token)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
        "$1[REDACTED]",
      )
      .replace(/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/gi, "$1[REDACTED]@");
  if (typeof value === "string") return replace(value);
  if (Array.isArray(value)) return value.map(redact);
  if (obj(value))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        /^(authorization|cookie|set-cookie|.*password.*|.*secret.*|.*api.?key.*|.*token.*|env|environment)$/i.test(
          k,
        )
          ? "[REDACTED]"
          : redact(v),
      ]),
    );
  return value;
}
export function gaps(run) {
  const out = [];
  if (run.events.some((e) => e.timestamp === null))
    out.push(
      "Some timestamps are unavailable; replay follows recorded sequence.",
    );
  const times = run.events
    .filter((e) => e.timestamp)
    .map((e) => Date.parse(e.timestamp));
  if (times.some((t, i) => i > 0 && t < times[i - 1]))
    out.push("Timestamps are non-monotonic; original order is preserved.");
  for (const e of run.events)
    if (
      e.type === "tool_call" &&
      !run.events.some((x) => x.type === "tool_result" && x.callId === e.callId)
    )
      out.push("No recorded result for " + e.id + ".");
  if (!run.events.some((e) => e.type === "completion"))
    out.push("No completion event was provided.");
  if (run.source.provider === "runledger")
    out.push(
      "RunLedger commands and tests are manually logged. Cross-list order and file-change timestamps are unavailable.",
    );
  return out;
}
export function metrics(run) {
  const e = run.events,
    times = e.map((x) =>
      x.timestamp === null ? null : Date.parse(x.timestamp),
    );
  const duration =
    times.every((x) => x !== null) &&
    times.every((x, i) => i === 0 || x >= times[i - 1])
      ? times.at(-1) - times[0]
      : null;
  return {
    events: e.length,
    tools: e.filter((x) => x.type === "tool_call").length,
    files: e
      .filter((x) => x.type === "file")
      .some((x) => typeof x.evidence?.path !== "string")
      ? null
      : new Set(e.filter((x) => x.type === "file").map((x) => x.evidence.path))
          .size,
    failures: e.filter((x) => x.status === "fail").length,
    checks: e.filter(
      (x) => ["test", "verification"].includes(x.type) && x.status === "pass",
    ).length,
    durationMs: duration,
    tokens: null,
    cost: null,
  };
}
export async function digest(value) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(value)),
      ),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
