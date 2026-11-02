import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  validateComposition,
  guardPromotion,
} from "../vendor/composer/scripts/contracts.mjs";
export async function checkComposition() {
  const apps = await Promise.all(
    ["run-importer", "replay-studio", "receipt-publisher"].map(async (id) => ({
      id,
      manifest: JSON.parse(
        await readFile("apps/" + id + "/app.manifest.json", "utf8"),
      ),
    })),
  );
  validateComposition(apps.map((a) => a.manifest));
  return apps;
}
// Local adapter: explicit release packaging. This does not register apps with Loftwah's native stack editor.
async function treeDigest(root) {
  const hash = createHash("sha256");
  async function walk(path, prefix = "") {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (entry.isDirectory())
        await walk(path + "/" + entry.name, prefix + entry.name + "/");
      else if (entry.isFile()) {
        const bytes = await readFile(path + "/" + entry.name);
        hash.update(prefix + entry.name + "\0" + bytes.length + "\0");
        hash.update(bytes);
      } else throw Error("Release artifacts must be regular files");
    }
  }
  await walk(root);
  return "sha256:" + hash.digest("hex");
}
export async function candidate() {
  const apps = await checkComposition();
  for (const app of apps) app.sourceDigest = await treeDigest("dist/" + app.id);
  const id = createHash("sha256").update(JSON.stringify(apps)).digest("hex");
  return { id, apps };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apps = await checkComposition();
  if (process.argv.includes("--promote-local")) {
    const next = await candidate();
    let active;
    try {
      active = JSON.parse(await readFile("composition.lock.json", "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (active) guardPromotion(active, next, active.id);
    await writeFile(
      "composition.lock.json",
      JSON.stringify(next, null, 2) + "\n",
    );
    console.log("Promoted reviewed local package pins; no cloud writes.");
  } else
    console.log(
      "Composer upstream validators accepted " +
        apps.map((a) => a.id).join(", "),
    );
}
