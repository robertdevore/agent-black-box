import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalize } from "../apps/run-importer/normalize.mjs";
import {
  gaps,
  metrics,
  redact,
  parse,
  validateRun,
  MAX_BYTES,
} from "../packages/contracts/run.mjs";
import { Playback } from "../apps/replay-studio/public/playback.mjs";
const fixture = JSON.parse(await readFile("fixtures/recovery.json", "utf8"));
const copy = () => structuredClone(fixture);
test("valid import retains order, timestamps, provenance and retry relationships", () => {
  const r = normalize(JSON.stringify(fixture));
  assert.deepEqual(r, fixture);
  assert.equal(r.events[7].retryOf, "e5");
  assert.equal(metrics(r).failures, 1);
  assert.equal(metrics(r).files, 1);
  assert.equal(metrics(r).durationMs, 33000);
  assert.equal(metrics(r).cost, null);
});
test("invalid and oversized JSON fail before normalization", () => {
  for (const raw of ["{", "null", "[]", '"hello"'])
    assert.throws(() => normalize(raw));
  assert.throws(() => parse(" ".repeat(MAX_BYTES + 1)), /1 MiB/);
  assert.throws(() => parse('{"__proto__":{}}'), /Unsafe/);
  assert.throws(() => parse("[".repeat(18) + "0" + "]".repeat(18)), /nesting/);
});
test("schema version, unknown fields and duplicate event IDs are rejected", () => {
  let r = copy();
  r.schema = "blackbox.run/v2";
  assert.throws(() => validateRun(r), /version/);
  r = copy();
  r.events[1].id = "e1";
  assert.throws(() => validateRun(r), /duplicate/);
  r = copy();
  r.events[0].reasoning = "private";
  assert.throws(() => validateRun(r), /Unknown/);
});
test("missing timestamp represented as null; absent timestamp rejected; backwards order preserved", () => {
  let r = copy();
  r.events[1].timestamp = null;
  assert.ok(gaps(validateRun(r)).some((x) => x.includes("timestamps")));
  assert.equal(metrics(r).durationMs, null);
  delete r.events[1].timestamp;
  assert.throws(() => validateRun(r));
  r = copy();
  r.events[1].timestamp = "2020-01-01T00:00:00Z";
  assert.equal(normalize(JSON.stringify(r)).events[1].id, "e2");
  assert.ok(gaps(r).some((x) => x.includes("non-monotonic")));
});
test("incomplete tool results disclose gaps; orphan results and invalid retries rejected", () => {
  let r = copy();
  r.events = r.events.filter((e) => e.id !== "e3");
  assert.ok(gaps(validateRun(r)).some((x) => x.includes("e2")));
  r = copy();
  r.events[2].callId = "nonexistent";
  assert.throws(() => validateRun(r), /matching/);
  r = copy();
  r.events[7].retryOf = "e12";
  assert.throws(() => validateRun(r), /earlier failed/);
});
test("redacts structured keys and known secret patterns without interpreting markup", () => {
  const r = redact({
    password: "never-share",
    nested: { Authorization: "Bearer abc" },
    text: "api_key=unsafe-value sk-1234567890abcdef ghp_1234567890abcdef <script>alert(1)</script>",
    env: { PRIVATE: "value" },
  });
  assert.equal(r.password, "[REDACTED]");
  assert.equal(r.env, "[REDACTED]");
  assert.ok(!JSON.stringify(r).includes("unsafe-value"));
  assert.ok(!r.text.includes("sk-"));
  assert.ok(r.text.includes("<script>"));
});
test("genuine RunLedger receipt imports without invented outputs or file timestamps", async () => {
  const r = normalize(
    await readFile("fixtures/runledger-success.json", "utf8"),
  );
  assert.equal(r.source.provider, "runledger");
  assert.equal(r.source.classification, "recorded");
  assert.ok(r.events.some((e) => e.type === "file"));
  assert.ok(r.events.some((e) => e.type === "test" && e.status === "pass"));
  assert.equal(r.events.filter((e) => e.type === "tool_result").length, 0);
  assert.equal(r.events.find((e) => e.type === "file").timestamp, null);
  assert.ok(gaps(r).some((x) => x.includes("Cross-list")));
});
test("playback clamps seek, steps, restarts and stops deterministically at the end", () => {
  const p = new Playback(3);
  assert.equal(p.step(-1), 0);
  p.play();
  assert.equal(p.tick(), 1);
  p.pause();
  assert.equal(p.tick(), 1);
  p.play();
  p.tick();
  assert.equal(p.playing, false);
  assert.equal(p.index, 2);
  p.play();
  assert.equal(p.index, 0);
  p.seek(999);
  assert.equal(p.index, 2);
  p.restart();
  assert.equal(p.index, 0);
});
test("invalid calendar dates and structural identifiers changed by redaction are rejected", () => {
  let r = copy();
  r.events[0].timestamp = "2026-02-30T00:00:00Z";
  assert.throws(() => validateRun(r));
  r = copy();
  r.id = "sk-1234567890abcdef";
  assert.throws(() => normalize(JSON.stringify(r)), /identity/);
});
