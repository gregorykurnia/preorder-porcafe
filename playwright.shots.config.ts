import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Screenshots of every screen at phone and desktop width, light and dark, into screenshots/.
export default defineConfig({
  ...base,
  testDir: "tests/shots",
  projects: [{ name: "shots" }],
});
