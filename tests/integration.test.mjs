import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import importer from "../apps/run-importer/worker.mjs";
import publisher from "../apps/receipt-publisher/worker.mjs";
import studio from "../apps/replay-studio/worker.mjs";
import {
  guardPromotion,
  validateComposition,
} from "../vendor/composer/scripts/contracts.mjs";
import { checkComposition } from "../scripts/compose.mjs";
const fixture = JSON.parse(await readFile("fixtures/recovery.json", "utf8"));
const token = "test-owner-" + "x".repeat(40);
function memory() {
  const map = new Map();
  return {
    async put(k, v) {
      if (map.has(k)) throw Error("duplicate");
      map.set(k, structuredClone(v));
    },
    async get(k) {
      return structuredClone(map.get(k) || null);
    },
    async remove(k) {
      map.delete(k);
    },
  };
}
function setup() {
  const importerStore = memory(),
    publisherStore = memory();
  const env = { OWNER_TOKEN: token, STORE: importerStore };
  const IMPORTER = { fetch: (r) => importer.fetch(r, env) };
  const pubEnv = { OWNER_TOKEN: token, STORE: publisherStore, IMPORTER };
  const PUBLISHER = { fetch: (r) => publisher.fetch(r, pubEnv) };
  return {
    env,
    pubEnv,
    importerStore,
    publisherStore,
    fetch: (r) =>
      studio.fetch(r, {
        IMPORTER,
        PUBLISHER,
        ASSETS: { fetch: () => new Response("asset") },
      }),
  };
}
const req = (path, body, headers = {}) =>
  new Request("https://blackbox.test" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
test("import → normalize → inspect failure → approve → public snapshot; private store never public", async () => {
  const s = setup();
  let r = await s.fetch(req("/api/runs", fixture));
  assert.equal(r.status, 201);
  const saved = await r.json();
  assert.equal(saved.run.events[4].status, "fail");
  assert.equal(
    (await s.fetch(req("/api/public/" + saved.id, null, { Authorization: "" })))
      .status,
    404,
  );
  assert.equal(
    (
      await s.fetch(
        req("/api/publish", {
          receiptId: saved.id,
          digest: saved.digest,
          approved: false,
        }),
      )
    ).status,
    403,
  );
  const pub = await (
    await s.fetch(
      req("/api/publish", {
        receiptId: saved.id,
        digest: saved.digest,
        approved: true,
      }),
    )
  ).json();
  const result = await s.fetch(
    req("/api/public/" + pub.id, null, { Authorization: "" }),
  );
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).run, saved.run);
  assert.equal(await s.importerStore.get(pub.id), null);
  assert.equal(await s.publisherStore.get(saved.id), null);
});
test("owner auth, cross-origin writes, content limits and stale approval rejected", async () => {
  const s = setup();
  assert.equal(
    (await s.fetch(req("/api/runs", fixture, { Authorization: "" }))).status,
    401,
  );
  assert.equal(
    (await s.fetch(req("/api/runs", fixture, { Origin: "https://evil.test" })))
      .status,
    403,
  );
  assert.equal(
    (await s.fetch(req("/api/runs", fixture, { "Content-Length": "1048577" })))
      .status,
    413,
  );
  assert.equal(
    (await s.fetch(req("/api/runs", fixture, { "Content-Type": "text/plain" })))
      .status,
    415,
  );
  const saved = await (await s.fetch(req("/api/runs", fixture))).json();
  assert.equal(
    (
      await s.fetch(
        req("/api/publish", {
          receiptId: saved.id,
          digest: "0".repeat(64),
          approved: true,
        }),
      )
    ).status,
    409,
  );
  assert.equal(
    (await publisher.fetch(req("/api/publish", {}), { STORE: memory() }))
      .status,
    503,
  );
});
test("revocation removes public access and requires owner", async () => {
  const s = setup();
  const saved = await (await s.fetch(req("/api/runs", fixture))).json();
  const pub = await (
    await s.fetch(
      req("/api/publish", {
        receiptId: saved.id,
        digest: saved.digest,
        approved: true,
      }),
    )
  ).json();
  const r = new Request("https://blackbox.test/api/public/" + pub.id, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  assert.equal((await s.fetch(r)).status, 200);
  assert.equal((await s.fetch(req("/api/public/" + pub.id))).status, 404);
});
test("Composer actual validators reject collisions, permission expansion, stale promotion", async () => {
  const apps = await checkComposition();
  assert.equal(validateComposition(apps.map((a) => a.manifest)), true);
  assert.throws(
    () => validateComposition([apps[0].manifest, apps[0].manifest]),
    /collision/,
  );
  const active = { id: "a", apps };
  const candidate = structuredClone(active);
  candidate.apps[0].manifest.capabilities = ["items:read"];
  assert.throws(() => guardPromotion(active, candidate, "a"), /Permission/);
  assert.throws(() => guardPromotion(active, active, "stale"), /stale/);
});
test("independent studio 1.0.1 promotion preserves importer receipts and publisher snapshots", async () => {
  const s = setup();
  const saved = await (await s.fetch(req("/api/runs", fixture))).json();
  const published = await (
    await s.fetch(
      req("/api/publish", {
        receiptId: saved.id,
        digest: saved.digest,
        approved: true,
      }),
    )
  ).json();
  const apps = await checkComposition(),
    active = { id: "original", apps };
  const candidate = structuredClone(active);
  candidate.apps.find((a) => a.id === "replay-studio").manifest.version =
    "1.0.1";
  assert.equal(guardPromotion(active, candidate, "original"), true);
  const upgraded =
    await import("../apps/replay-studio/worker.mjs?release=1.0.1");
  const env = {
    IMPORTER: { fetch: (r) => importer.fetch(r, s.env) },
    PUBLISHER: { fetch: (r) => publisher.fetch(r, s.pubEnv) },
  };
  assert.deepEqual(
    (
      await (
        await upgraded.default.fetch(req("/api/runs/" + saved.id), env)
      ).json()
    ).run,
    saved.run,
  );
  assert.deepEqual(
    (
      await (
        await upgraded.default.fetch(req("/api/public/" + published.id), env)
      ).json()
    ).run,
    saved.run,
  );
});
test("hosted studio responses carry CSP and anti-framing protection", async () => {
  const s = setup();
  const response = await s.fetch(req("/"));
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
});
test("asset-only updates change the Studio release identity", async () => {
  const { candidate } = await import("../scripts/compose.mjs");
  const { mkdir, writeFile, rm } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["scripts/build.mjs"]);
  const before = await candidate();
  const file = "dist/replay-studio/public/upgrade-proof.txt";
  try {
    await writeFile(file, "asset revision 2");
    const after = await candidate();
    assert.notEqual(before.id, after.id);
    assert.notEqual(before.apps[1].sourceDigest, after.apps[1].sourceDigest);
    assert.equal(before.apps[0].sourceDigest, after.apps[0].sourceDigest);
  } finally {
    await rm(file, { force: true });
  }
});
