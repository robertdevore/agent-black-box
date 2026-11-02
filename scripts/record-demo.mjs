// Capture actual localhost browser interaction. Run npm run dev first.
import { chromium } from "@playwright/test";
import { mkdir, rename, rm } from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: ".private/recording",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);
try {
  await page.goto("http://127.0.0.1:4173");
  await wait(2500);
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await wait(4100);
  await page.getByRole("button", { name: "Pause replay" }).click();
  await page
    .getByRole("button", {
      name: "Event 4: Add duplicate detection",
      exact: true,
    })
    .click();
  await wait(3000);
  await page
    .getByRole("button", {
      name: "Event 5: Duplicate-ID test fails",
      exact: true,
    })
    .click();
  await wait(5000);
  await page
    .getByRole("button", {
      name: "Event 8: Correct the validator",
      exact: true,
    })
    .click();
  await wait(2500);
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await wait(4500);
  await page
    .getByRole("button", {
      name: "Event 10: Duplicate-ID test passes",
      exact: true,
    })
    .click();
  await wait(3000);
  await page.locator("#scenario").selectOption("success");
  await page
    .getByRole("button", { name: /Arithmetic output matches 42/ })
    .click();
  await wait(4500);
  await page.getByRole("button", { name: "Share report" }).click();
  await wait(3000);
  await page.locator("#approve").check();
  await page.getByRole("button", { name: "Publish approved report" }).click();
  const url = await page
    .getByRole("link", { name: "Open public report" })
    .getAttribute("href");
  await page.goto("http://127.0.0.1:4173" + url);
  await wait(3000);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await wait(2500);
  const video = page.video();
  await context.close();
  await mkdir("evidence", { recursive: true });
  await video.saveAs("evidence/demo.webm");
  console.log("Saved actual browser capture: evidence/demo.webm");
} finally {
  await browser.close();
  await rm(".private/recording", { recursive: true, force: true });
}
