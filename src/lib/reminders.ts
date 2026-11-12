import { addDays, daysBetween } from "./dates";
import type { Status } from "./status";

export type ReminderSettings = { followDays: number; ghostDays: number; soonDays: number };

export type AppForReminder = {
  id: string;
  company: string;
  position: string;
  status: string;
  lastActivityOn: string;
  snoozedUntil: string | null;
};

export type EventForReminder = {
  applicationId: string;
  type: string;
  occurredOn: string;
  atTime: string | null;
  round: number | null;
  mode: string | null;
  location: string | null;
};

export type Reminder =
  | { kind: "upcoming"; appId: string; company: string; date: string; time: string | null; title: string; detail: string | null }
  | { kind: "follow"; appId: string; company: string; days: number }
  | { kind: "ghost"; appId: string; company: string; days: number };

const WAITING: Status[] = ["sent", "replied", "interviewed"];

/**
 * lastActivityOn ที่เก็บใน DB คำนวณตอนบันทึก — นัดที่เคยอยู่ในอนาคตแล้วผ่านไปแล้วจะยังไม่ถูกนับ
 * จึงคำนวณใหม่จาก events ก่อนใช้เตือนทุกครั้ง
 */
export function withFreshActivity<T extends AppForReminder & { appliedOn: string }>(apps: T[], evs: EventForReminder[], today: string): T[] {
  return apps.map((a) => {
    let last = a.appliedOn;
    for (const e of evs) if (e.applicationId === a.id && e.occurredOn <= today && e.occurredOn > last) last = e.occurredOn;
    return last === a.lastActivityOn ? a : { ...a, lastActivityOn: last };
  });
}

/** คำนวณสิ่งที่ต้องเตือน ใช้ทั้งในเว็บและใน cron ที่ส่ง LINE */
export function computeReminders(
  apps: AppForReminder[],
  evs: EventForReminder[],
  settings: ReminderSettings,
  today: string,
): Reminder[] {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const out: Reminder[] = [];

  // นัดสัมภาษณ์ / กำหนดส่งที่ใกล้ถึง
  const until = addDays(today, settings.soonDays);
  for (const e of evs) {
    if (e.type !== "interview" && e.type !== "assignment") continue;
    if (e.occurredOn < today || e.occurredOn > until) continue;
    const app = byId.get(e.applicationId);
    if (!app) continue;
    const title = e.type === "interview" ? `สัมภาษณ์${e.round ? `รอบ ${e.round}` : ""}` : "ส่ง Assignment";
    const detail = [e.mode === "online" ? "Online" : e.mode === "onsite" ? "Onsite" : null, e.location].filter(Boolean).join(" · ") || null;
    out.push({ kind: "upcoming", appId: app.id, company: app.company, date: e.occurredOn, time: e.atTime, title, detail });
  }
  out.sort((a, b) => (a.kind === "upcoming" && b.kind === "upcoming" ? `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`) : 0));

  // รอนานเกินไป
  for (const a of apps) {
    if (!WAITING.includes(a.status as Status)) continue;
    if (a.snoozedUntil && a.snoozedUntil >= today) continue;
    // มีนัดในอนาคตอยู่แล้ว ไม่ต้องเตือนให้ตาม
    if (evs.some((e) => e.applicationId === a.id && e.occurredOn >= today && (e.type === "interview" || e.type === "assignment"))) continue;
    const days = daysBetween(a.lastActivityOn, today);
    if (days >= settings.ghostDays) out.push({ kind: "ghost", appId: a.id, company: a.company, days });
    else if (days >= settings.followDays) out.push({ kind: "follow", appId: a.id, company: a.company, days });
  }
  return out;
}
