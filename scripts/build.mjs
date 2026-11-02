import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { normalize } from "../apps/run-importer/normalize.mjs";
import { checkComposition } from "./compose.mjs";
const names = ["run-importer", "replay-studio", "receipt-publisher"];
await checkComposition();
for (const name of names.filter(
  (n) => !process.argv[2] || n === process.argv[2],
)) {
  await mkdir("dist/" + name, { recursive: true });
  await build({
    entryPoints: ["apps/" + name + "/worker.mjs"],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile: "dist/" + name + "/worker.mjs",
  });
  await cp(
    "apps/" + name + "/app.manifest.json",
    "dist/" + name + "/app.manifest.json",
  );
  if (name === "replay-studio") {
    await cp("apps/replay-studio/public", "dist/replay-studio/public", {
      recursive: true,
    });
    await cp("packages/contracts/run.mjs", "dist/replay-studio/public/run.mjs");
    await mkdir("dist/replay-studio/public/fixtures", { recursive: true });
    await cp(
      "fixtures/recovery.json",
      "dist/replay-studio/public/fixtures/recovery.json",
    );
    await writeFile(
      "dist/replay-studio/public/fixtures/success.json",
      JSON.stringify(
        normalize(await readFile("fixtures/runledger-success.json", "utf8")),
      ),
    );
  }
}
console.log("Built " + (process.argv[2] || "all three independent Workers"));
