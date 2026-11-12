import { defineConfig } from "drizzle-kit";

// ใช้แค่สร้างไฟล์ migration (npm run db:generate) — การ apply ใช้ wrangler d1 migrations
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
