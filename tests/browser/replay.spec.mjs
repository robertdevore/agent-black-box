import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
const fixture = JSON.parse(await readFile("fixtures/recovery.json", "utf8"));
test("full import, failure inspection, recovery replay and approved public report", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import receipt" }).click();
  await page.locator("#import-json").fill(JSON.stringify(fixture));
  await page.getByRole("button", { name: "Import and replay" }).click();
  await expect(page.locator("#import-dialog")).not.toBeVisible();
  await page
    .getByRole("button", {
      name: "Event 5: Duplicate-ID test fails",
      exact: true,
    })
    .click();
  await expect(page.locator("#event-title")).toHaveText(
    "Duplicate-ID test fails",
  );
  await expect(page.locator("#timeline")).toHaveValue("4");
  await expect(page.locator("#evidence")).toContainText(
    "Missing expected exception",
  );
  await page.getByLabel("Playback speed").selectOption("4");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect(page.locator("#event-title")).toHaveText(
    "Verified and ready to inspect",
    { timeout: 10000 },
  );
  await page.getByRole("button", { name: "Share report" }).click();
  await expect(page.locator("#publish-preview")).toContainText(
    "Synthetic demonstration",
  );
  await page.locator("#approve").check();
  await page.getByRole("button", { name: "Publish approved report" }).click();
  const href = await page
    .getByRole("link", { name: "Open public report" })
    .getAttribute("href");
  const anonymous = await context.browser().newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto("http://127.0.0.1:4173" + href);
  await expect(publicPage.locator("#title")).toHaveText(fixture.title);
  await expect(publicPage.locator("#scenario")).not.toBeVisible();
  await expect(
    publicPage.getByRole("button", { name: "Share report" }),
  ).not.toBeVisible();
  await publicPage
    .getByRole("button", {
      name: "Event 5: Duplicate-ID test fails",
      exact: true,
    })
    .click();
  await expect(publicPage.locator("#evidence")).toContainText(
    "Missing expected exception",
  );
  await publicPage.screenshot({
    path: "evidence/public-report.png",
    fullPage: true,
  });
  await anonymous.close();
});
test("keyboard, slider, playback and reduced-motion preferences", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#graph").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#timeline")).toHaveValue("1");
  await page.getByLabel("Replay timeline").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#event-title")).toHaveText(
    "Verified and ready to inspect",
  );
  await page.getByRole("button", { name: "Restart replay" }).click();
  await expect(page.locator("#timeline")).toHaveValue("0");
  await page.locator("#graph").focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Pause replay" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeVisible();
});
test("desktop and phone accessibility, layout and screenshots", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page
      .getByRole("button", {
        name: "Event 5: Duplicate-ID test fails",
        exact: true,
      })
      .click();
    await expect(page.locator("#event-title")).toHaveText(
      "Duplicate-ID test fails",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({
      path: `evidence/replay-${width}.png`,
      fullPage: true,
    });
  }
});
test("recorded example and safe text rendering", async ({ page }) => {
  await page.goto("/");
  await page.locator("#scenario").selectOption("success");
  await expect(page.locator("#source-kind")).toHaveText("RECORDED EXECUTION");
  await expect(page.locator("#gaps")).toContainText("manually logged");
  const unsafe = structuredClone(fixture);
  unsafe.events[0].label = "<img src=x onerror=alert(1)>";
  unsafe.events[0].evidence = {
    html: "<script>window.pwned=true</script>",
    url: "javascript:alert(1)",
  };
  await page.getByRole("button", { name: "Import receipt" }).click();
  await page.locator("#import-json").fill(JSON.stringify(unsafe));
  await page.getByRole("button", { name: "Import and replay" }).click();
  await expect(page.locator("#event-title")).toHaveText(unsafe.events[0].label);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
  await expect(page.locator("#evidence script")).toHaveCount(0);
});
test("graph row turns connect consecutive events and large traces stay bounded", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const columns = width === 1440 ? 3 : 2;
    const last = await page
      .locator(`[data-event="${columns - 1}"]`)
      .boundingBox();
    const next = await page.locator(`[data-event="${columns}"]`).boundingBox();
    expect(Math.abs(last.x - next.x)).toBeLessThan(2);
    expect(next.y).toBeGreaterThan(last.y);
    await expect(page.locator(`[data-event="${columns - 1}"]`)).toHaveAttribute(
      "data-edge",
      "down",
    );
  }
  const large = structuredClone(fixture);
  large.events = Array.from({ length: 1000 }, (_, i) => ({
    id: "event-" + i,
    type: "test",
    label: "Check " + i,
    timestamp: null,
    status: "pass",
    sourceId: "source-" + i,
    evidence: { output: "ok" },
  }));
  await page.getByRole("button", { name: "Import receipt" }).click();
  await page.locator("#import-json").fill(JSON.stringify(large));
  await page.getByRole("button", { name: "Import and replay" }).click();
  await expect(page.locator(".node")).toHaveCount(60);
  await page.getByLabel("Replay timeline").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#event-title")).toHaveText("Check 999");
  await expect(page.locator(".node")).toHaveCount(60);
});

test('recorded inventory run keeps event inspection usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Import receipt' }).click();
  await page.locator('#file').setInputFiles('videos/real-world-explainer/evidence/recorded-run.json');
  await page.getByRole('button', { name: 'Import and replay' }).click();
  await expect(page.locator('#source-kind')).toHaveText('RECORDED EXECUTION');
  await expect(page.locator('#scenario')).toHaveValue('imported');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.locator('#message')).not.toBeVisible();
  await page.locator('[data-event="3"]').click();
  await expect(page.locator('#evidence')).toContainText('Missing expected exception');
  await page.locator('.inspector-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect(await page.locator('.inspector-body').evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  await page.locator('[data-event="7"]').click();
  expect(await page.locator('.inspector-body').evaluate(el => el.scrollTop)).toBe(0);
  await expect(page.locator('#evidence')).toContainText('rawSku.trim()');
  await page.locator('[data-event="8"]').click();
  await expect(page.locator('#evidence')).toContainText('pass 4');
  await expect(page.locator('#timeline')).toHaveValue('8');
});
