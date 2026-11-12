// Worker หลัก: ส่ง request ให้ Next.js (สร้างโดย `opennextjs-cloudflare build`)
// และเพิ่ม cron (scheduled) สำหรับส่งสรุปเข้า LINE — cron ไม่มี URL ให้คนภายนอกเรียก (requirements S7)

// @ts-ignore ไฟล์นี้เกิดตอน build
import { default as handler } from "./.open-next/worker.js";
import { runDailyDigest } from "./src/lib/digest";

export default {
  fetch: handler.fetch,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runDailyDigest(env));
  },
} satisfies ExportedHandler<CloudflareEnv>;
