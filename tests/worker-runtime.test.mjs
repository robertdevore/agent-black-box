import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { guardPromotion } from "../vendor/composer/scripts/contracts.mjs";
import { checkComposition } from "../scripts/compose.mjs";
test("real Worker service bindings and separate D1 survive independent studio code update", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "blackbox-workers-"));
  let mf;
  try {
    const scripts = {};
    for (const name of ["run-importer", "receipt-publisher", "replay-studio"])
      scripts[name] = (
        await build({
          entryPoints: ["apps/" + name + "/worker.mjs"],
          bundle: true,
          format: "esm",
          platform: "browser",
          write: false,
        })
      ).outputFiles[0].text;
    const token = "runtime-test-" + "x".repeat(40);
    const workers = [
      {
        name: "studio",
        script: scripts["replay-studio"],
        modules: true,
        compatibilityDate: "2026-11-02",
        serviceBindings: {
          IMPORTER: "importer",
          PUBLISHER: "publisher",
          ASSETS: () => new Response("static fixture"),
        },
      },
      {
        name: "importer",
        script: scripts["run-importer"],
        modules: true,
        compatibilityDate: "2026-11-02",
        bindings: { OWNER_TOKEN: token },
        d1Databases: { DB: "private-receipts" },
      },
      {
        name: "publisher",
        script: scripts["receipt-publisher"],
        modules: true,
        compatibilityDate: "2026-11-02",
        bindings: { OWNER_TOKEN: token },
        d1Databases: { DB: "public-snapshots" },
        serviceBindings: { IMPORTER: "importer" },
      },
    ];
    const opts = { workers, d1Persist: tmp };
    mf = new Miniflare(convertV4MiniflareOptions(opts));
    for (const name of ["importer", "publisher"])
      await (
        await mf.getD1Database("DB", name)
      ).exec("CREATE TABLE records(id TEXT PRIMARY KEY,body TEXT NOT NULL)");
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
    const input = await readFile("fixtures/recovery.json", "utf8");
    const imported = await mf.dispatchFetch("http://localhost/api/runs", {
      method: "POST",
      headers,
      body: input,
    });
    assert.equal(imported.status, 201);
    const saved = await imported.json();
    const pub = await (
      await mf.dispatchFetch("http://localhost/api/publish", {
        method: "POST",
        headers,
        body: JSON.stringify({
          receiptId: saved.id,
          digest: saved.digest,
          approved: true,
        }),
      })
    ).json();
    assert.ok(pub.id);
    const oldApps = await checkComposition();
    const next = structuredClone(oldApps);
    next.find((a) => a.id === "replay-studio").manifest.version = "1.0.1";
    assert.equal(
      guardPromotion({ id: "v1", apps: oldApps }, { apps: next }, "v1"),
      true,
    );
    // Actual new executable bytes and runtime replacement, with both data services unchanged.
    workers[0] = {
      ...workers[0],
      script: workers[0].script.replace('version: "1.0.0"', 'version: "1.0.1"'),
    };
    assert.notEqual(workers[0].script, scripts["replay-studio"]);
    await mf.setOptions(convertV4MiniflareOptions({ ...opts, workers }));
    assert.equal(
      (await (await mf.dispatchFetch("http://localhost/health")).json())
        .version,
      "1.0.1",
    );
    assert.deepEqual(
      (
        await (
          await mf.dispatchFetch("http://localhost/api/runs/" + saved.id, {
            headers,
          })
        ).json()
      ).run,
      saved.run,
    );
    assert.deepEqual(
      (
        await (
          await mf.dispatchFetch("http://localhost/api/public/" + pub.id)
        ).json()
      ).run,
      saved.run,
    );
    await writeFile(
      "evidence/worker-upgrade.json",
      JSON.stringify(
        {
          runtime: "Miniflare/workerd",
          result: "pass",
          before: "1.0.0",
          after: "1.0.1",
          serviceBindings: [
            "studio → importer",
            "studio → publisher",
            "publisher → importer",
          ],
          privateReceiptRetained: true,
          publicSnapshotRetained: true,
          cloudDeployment: false,
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await mf?.dispose();
    await rm(tmp, { recursive: true, force: true });
  }
});
