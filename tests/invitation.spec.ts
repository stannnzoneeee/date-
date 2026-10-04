import { expect, test } from "@playwright/test";
import { buildCalendarUrl, upcomingWeekend } from "../lib/calendar";

test("all eight No reactions work with touch and keyboard without covering Yes", async ({ page, isMobile }) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) external.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Will you go ona date with me?");
  const gif = page.locator("picture img");
  await expect.poll(() => gif.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => gif.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(isMobile ? "/shy.gif" : "/waiting.gif");
  await page.screenshot({ path: test.info().outputPath("invitation.png"), fullPage: true });
  const no = page.locator(".button-no");
  for (const asset of ["begging", "crying", "angry", "reading", "bawling", "sad", "shy", "waiting"]) {
    if (isMobile) await no.tap();
    else { await page.mouse.move(0, 0); await no.focus(); await no.press("Enter"); }
    await expect.poll(() => gif.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(`/${asset}.gif`);
    await expect.poll(() => gif.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect.poll(() => no.evaluate((element) => element.getAnimations().some((animation) => animation.playState === "running"))).toBe(false);
    const bounds = await no.boundingBox();
    const card = await page.locator(".postcard-paper").boundingBox();
    const yes = await page.getByRole("button", { name: "Yes!!!", exact: true }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(card!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(card!.x + card!.width + 1);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    expect(bounds!.x < yes!.x + yes!.width && bounds!.x + bounds!.width > yes!.x && bounds!.y < yes!.y + yes!.height && bounds!.y + bounds!.height > yes!.y).toBe(false);
  }
  await expect(page.locator(".reaction-hint")).toHaveText("still here. still cute. still buying you fries.");
  if (!isMobile) {
    // The desktop dodge deliberately has a 650 ms cooldown.
    await page.waitForTimeout(700);
    await no.hover();
    await expect.poll(() => gif.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain("/begging.gif");
  }
  await page.screenshot({ path: test.info().outputPath("reaction.png"), fullPage: true });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("date cards select a weekend and a custom plan opens the correct calendar event", async ({ page, context }) => {
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00+08:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "Yes!!!", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yayyyyyyyy!!! Finally");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  const calendarButton = page.getByRole("button", { name: "Add to Google Calendar" });
  await expect(calendarButton).toBeDisabled();
  const saturday = page.getByRole("radio", { name: "Saturday October 10" });
  const sunday = page.getByRole("radio", { name: "Sunday October 11" });
  await saturday.check();
  await expect(saturday).toBeChecked();
  await expect(calendarButton).toBeEnabled();
  await expect(page.locator("#calendar-hint")).toHaveText(/^10:00\sAM – 5:00\sPM · your local time$/);
  await saturday.press("ArrowRight");
  await expect(sunday).toBeChecked();
  await page.screenshot({ path: test.info().outputPath("date-cards.png"), fullPage: true });
  const custom = page.getByRole("radio", { name: /Choose your own date/ });
  await custom.check();
  await expect(sunday).not.toBeChecked();
  await expect(calendarButton).toBeDisabled();
  await page.getByLabel("Your preferred date").fill("2030-12-31");
  await saturday.check();
  await expect(page.getByLabel("Your preferred date")).toHaveCount(0);
  await custom.check();
  await expect(page.getByLabel("Your preferred date")).toHaveValue("2030-12-31");
  await page.getByText("Change the time or place?").click();
  await page.getByLabel("Our time").fill("23:30");
  await page.getByLabel("Our spot").fill("Café & ice cream + a walk");
  await context.route("https://calendar.google.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Calendar preview</title>" }));
  await page.route("https://formsubmit.co/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"success":"true"}' }));
  const notifyPromise = page.waitForRequest("https://formsubmit.co/ajax/stanly16tomas@gmail.com");
  const popupPromise = page.waitForEvent("popup");
  await calendarButton.click();
  const notify = (await notifyPromise).postDataJSON();
  expect(notify).toMatchObject({ date: "Tuesday, December 31", place: "Café & ice cream + a walk" });
  expect(notify.time).toMatch(/^11:30\sPM – 6:30\sAM$/);
  const calendar = await popupPromise;
  await calendar.waitForLoadState();
  const url = new URL(calendar.url());
  expect(url.origin).toBe("https://calendar.google.com");
  expect(url.searchParams.get("action")).toBe("TEMPLATE");
  expect(url.searchParams.get("dates")).toBe("20301231T153000Z/20301231T223000Z");
  expect(url.searchParams.get("location")).toBe("Café & ice cream + a walk");
  expect(url.searchParams.get("text")).toBe("It's a date! 💕");
  expect(url.searchParams.get("add")).toBe("stanly16tomas@gmail.com");
  expect(await calendar.evaluate(() => window.opener)).toBeNull();
  await calendar.close();
  await expect(page.locator(".confirmation")).toContainText("Tuesday, December 31");
  await expect(page.locator(".confirmation")).toContainText("Hit Save in Google Calendar.");
  await expect(page.getByRole("link", { name: "Open Google Calendar again" })).toHaveAttribute("href", url.toString());
  await page.screenshot({ path: test.info().outputPath("confirmation.png"), fullPage: true });
  await page.getByRole("button", { name: "Change our little plan" }).click();
  await expect(calendarButton).toBeEnabled();
  await page.getByRole("button", { name: "Read my little note again" }).click();
  await expect(page.getByRole("button", { name: "Yes!!!", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "No", exact: true })).toBeVisible();
});

test("custom dates reject past times and incomplete plans cannot be submitted", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2030-03-10T12:00:00+08:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "Yes!!!", exact: true }).click();
  await page.getByRole("radio", { name: /Choose your own date/ }).check();
  await page.getByLabel("Your preferred date").fill("2030-03-10");
  await page.getByText("Change the time or place?").click();
  await page.getByLabel("Our time").fill("11:30");
  await page.getByRole("button", { name: "Add to Google Calendar" }).click();
  await expect(page.locator("#calendar-error")).toContainText("Pick a future date and time");
  await page.getByLabel("Your preferred date").fill("");
  await expect(page.getByRole("button", { name: "Add to Google Calendar" })).toBeDisabled();
  await page.getByRole("radio", { name: /Saturday/ }).check();
  await expect(page.getByRole("button", { name: "Add to Google Calendar" })).toBeEnabled();
  await expect(page.locator("#calendar-error")).toHaveCount(0);
});

test("320px screens fit the invitation, date cards, and expanded planner", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits()).toBe(true);
  await page.getByRole("button", { name: "No", exact: true }).click();
  expect(await fits()).toBe(true);
  await page.getByRole("button", { name: "Yes!!!", exact: true }).click();
  expect(await fits()).toBe(true);
  await page.getByRole("radio", { name: /Sunday/ }).check();
  await page.getByRole("radio", { name: /Choose your own date/ }).check();
  await page.getByLabel("Your preferred date").fill("2030-12-31");
  await page.getByText("Change the time or place?").click();
  expect(await fits()).toBe(true);
  await page.getByRole("button", { name: "Add to Google Calendar" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Add to Google Calendar" })).toBeInViewport();
});

test("reduced motion keeps No still, uses still images, and supports failed media", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect.poll(() => page.locator("picture img").evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(isMobile ? "/shy.png" : "/waiting.png");
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect.poll(() => page.locator("picture img").evaluate((image: HTMLImageElement) => image.currentSrc)).toContain("/begging.png");
  await expect(page.locator(".button-no")).toHaveCSS("position", "static");
  await page.route("**/gifs/*", (route) => route.abort());
  await page.reload();
  await expect(page.locator(".gif-fallback")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yes!!!", exact: true })).toBeVisible();
});

test("legacy pages redirect home and legacy APIs are absent", async ({ request }) => {
  for (const route of ["/landing", "/create", "/manage", "/admin", "/date", "/index.html", "/landing.html", "/create.html", "/admin.html", "/date.html", "/d-abc123"]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/");
  }
  for (const route of ["/api/links", "/api/admin/me", "/api/visitor", "/api/track", "/unknown-page"]) expect((await request.get(route)).status()).toBe(404);
});

test("calendar dates stay valid across year boundaries", () => {
  expect(upcomingWeekend(new Date(2026, 11, 31, 12)).map((date) => date.value)).toEqual(["2027-01-02", "2027-01-03"]);
  expect(upcomingWeekend(new Date(2026, 9, 10, 12)).map((date) => date.value)).toEqual(["2026-10-17", "2026-10-18"]);
  const now = new Date("2029-01-01T00:00:00Z");
  for (const [date, time] of [["bad", "18:00"], ["2030-02-30", "18:00"], ["2030-12-01", "25:00"], ["2020-01-01", "12:00"]]) expect(buildCalendarUrl(date, time, "", now)).toBeNull();
  const url = new URL(buildCalendarUrl("2030-01-01", "18:00", "  ", now)!);
  expect(url.searchParams.has("location")).toBe(false);
});
