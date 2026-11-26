import { defineConfig, devices } from "@playwright/test";

// Runs against a production build on port 3100 with a throwaway local PGlite
// database (.data/e2e, wiped first). It never reaches Neon: DATABASE_URL is blanked.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `rm -rf .data/e2e && next build && next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { DATABASE_URL: "", PGLITE_DIR: ".data/e2e", STAFF_PASSWORD: "e2e-staff-pass" },
  },
});
