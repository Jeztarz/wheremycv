import { and, asc, desc, eq } from "drizzle-orm";
import { applications, blacklist, events } from "@/db/schema";
import { todayBkk } from "./dates";
import type { DB } from "./env";
import { deriveStatus } from "./status";

// ทุก query กรองด้วย userId เสมอ (requirements ข้อ 10)

export async function listApplications(d: DB, userId: string) {
  return d.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.lastActivityOn), desc(applications.createdAt));
}

export async function listEvents(d: DB, userId: string) {
  return d.select().from(events).where(eq(events.userId, userId)).orderBy(asc(events.occurredOn), asc(events.atTime));
}

export async function getApplication(d: DB, userId: string, id: string) {
  const app = await d.query.applications.findFirst({ where: and(eq(applications.id, id), eq(applications.userId, userId)) });
  if (!app) return null;
  const evs = await d.select().from(events).where(and(eq(events.applicationId, id), eq(events.userId, userId)));
  return { app, events: evs };
}

/** คำนวณสถานะและวันกิจกรรมล่าสุดใหม่ หลังเพิ่ม/ลบ/แก้เหตุการณ์ */
export async function recomputeApplication(d: DB, userId: string, id: string) {
  const found = await getApplication(d, userId, id);
  if (!found) return;
  const { status, lastActivityOn } = deriveStatus(found.app.appliedOn, found.events, todayBkk());
  await d
    .update(applications)
    .set({ status, lastActivityOn, updatedAt: new Date().toISOString() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function listBlacklist(d: DB, userId: string) {
  return d.select().from(blacklist).where(eq(blacklist.userId, userId)).orderBy(desc(blacklist.createdAt));
}
