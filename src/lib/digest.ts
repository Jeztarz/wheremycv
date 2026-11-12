// สรุปประจำวันที่ส่งเข้า LINE — เรียกจาก cron ใน worker.ts ทุกชั่วโมง
// (ใช้ relative import เพราะไฟล์นี้ถูก bundle แยกจาก Next.js)
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { applications, events, users } from "../db/schema";
import { parseAllowlist } from "./auth-core";
import { hourBkk, todayBkk } from "./dates";
import { dailySummaryMessage, pushLine } from "./line-push";
import { computeReminders, withFreshActivity } from "./reminders";

export async function runDailyDigest(env: CloudflareEnv, now = new Date()) {
  const d = drizzle(env.DB, { schema });
  const today = todayBkk(now);
  const hour = hourBkk(now);
  const allow = parseAllowlist(env.ALLOWED_LINE_USER_IDS);
  const openUrl = env.LIFF_ID ? `https://liff.line.me/${env.LIFF_ID}` : (env.APP_URL ?? "");
  if (!/^https:\/\//.test(openUrl)) {
    console.warn("digest: ไม่มี LIFF_ID หรือ APP_URL ที่เป็น https — ข้ามการส่ง");
    return;
  }

  const due = await d.select().from(users).where(and(eq(users.lineNotify, true), eq(users.notifyHour, hour)));
  for (const u of due) {
    if (!allow.has(u.id) || u.lastNotifiedOn === today) continue;
    const [apps, evs] = await Promise.all([
      d.select().from(applications).where(eq(applications.userId, u.id)),
      d.select().from(events).where(eq(events.userId, u.id)),
    ]);
    const reminders = computeReminders(withFreshActivity(apps, evs, today), evs, u, today);
    if (reminders.length === 0) continue; // ไม่มีอะไรต้องเตือน → ไม่ส่ง (ประหยัดโควตา)

    const res = await pushLine(env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN, u.id, [dailySummaryMessage(reminders, today, openUrl)]);
    if (res.ok) {
      await d.update(users).set({ lastNotifiedOn: today }).where(eq(users.id, u.id));
    } else {
      console.error(`digest: ส่งให้ ${u.id.slice(0, 6)}… ไม่สำเร็จ: ${res.error}`);
    }
  }
}
