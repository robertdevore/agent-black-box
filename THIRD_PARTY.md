# Attribution

App Composer: Loftwah and contributors, MIT. `vendor/composer/` contains unchanged contract validation code and its transitive device-support validator from the exact commit in PROVENANCE.json. Original LICENSE is retained. The architecture is informed by Composer's independently deployed Guestbook/Showcase examples; no artwork or brand assets were copied.

Kujo RunLedger, PackWrite and kujo-workflows are MIT projects by the Kujo contributors. Their CLIs were executed from local checkouts; runtime source is not embedded in this application. See docs/RESEARCH.md for pins and boundaries.

Development dependencies (exact versions/integrity in package-lock.json): esbuild (MIT), Playwright (Apache-2.0), axe-core integration (MPL-2.0), Wrangler/Miniflare/workerd (Apache-2.0 / respective package notices). These are development/build/test tools, not copied into the browser application. No third-party fonts or images are loaded. The production Worker bundles contain this project's code; Composer validation remains a build/promotion dependency. Preserve dependency notices when redistributing tool binaries. Root MIT covers original application code, not a relicensing of dependencies.
