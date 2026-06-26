import { defineConfig } from "@playwright/test";

const dbName = process.env.DB_NAME || "e2e_db.sqlite3";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  webServer: [
    {
      command: `DB_NAME=${dbName} python ../manage.py migrate --noinput && DB_NAME=${dbName} python ../manage.py runserver 0.0.0.0:8001 --noreload`,
      port: 8001,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "API_TARGET=http://localhost:8001 npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
