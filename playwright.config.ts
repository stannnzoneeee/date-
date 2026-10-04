import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 3,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    timezoneId: "Asia/Manila",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "iphone", use: { ...devices["iPhone 13"], defaultBrowserType: "webkit" } },
  ],
  webServer: {
    command: "npm run start -- --port 3100 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
