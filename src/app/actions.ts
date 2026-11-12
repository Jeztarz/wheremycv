"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applications, blacklist, events, users } from "@/db/schema";
import { companyKey } from "@/lib/company";
import { requireUser } from "@/lib/auth";
import { addDays, isDate, isTime, todayBkk } from "@/lib/dates";
import { db, env } from "@/lib/env";
import { pushLine } from "@/lib/line-push";
import { getApplication, recomputeApplication } from "@/lib/queries";
import { isEventType } from "@/lib/status";

function str(fd: FormData, key: string, max = 200): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t === "" ? null : t;
}

function url(fd: FormData, key: string): string | null {
  const v = str(fd, key, 1000);
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function int(fd: FormData, key: string, min: number, max: number): number | null {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function appFields(fd: FormData) {
  const company = str(fd, "company");
  const position = str(fd, "position");
  const appliedOn = str(fd, "appliedOn");
  if (!company || !position || !isDate(appliedOn)) throw new Error("กรอกชื่อบริษัท ตำแหน่ง และวันที่ส่งให้ครบ");
  return {
    company,
    position,
    appliedOn,
    channel: str(fd, "channel", 50),
    jobUrl: url(fd, "jobUrl"),
    salaryExpected: str(fd, "salaryExpected", 50),
    salaryOffered: str(fd, "salaryOffered", 50),
    contactName: str(fd, "contactName"),
    contactEmail: str(fd, "contactEmail"),
    contactPhone: str(fd, "contactPhone", 50),
    note: str(fd, "note", 2000),
  };
}

export async function createApplication(fd: FormData) {
  const user = await requireUser();
  const fields = appFields(fd);
  const id = crypto.randomUUID();
  await db()
    .insert(applications)
    .values({ id, userId: user.id, ...fields, status: "sent", lastActivityOn: fields.appliedOn });
  revalidatePath("/");
  redirect(`/apps/${id}`);
}

export async function updateApplication(id: string, fd: FormData) {
  const user = await requireUser();
  const fields = appFields(fd);
  const d = db();
  await d
    .update(applications)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  await recomputeApplication(d, user.id, id);
  revalidatePath("/", "layout");
  redirect(`/apps/${id}`);
}

export async function deleteApplication(id: string) {
  const user = await requireUser();
  const d = db();
  // ลบ events ก่อนเผื่อ D1 ไม่ได้เปิด foreign key cascade
  await d.delete(events).where(and(eq(events.applicationId, id), eq(events.userId, user.id)));
  await d.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addEvent(appId: string, fd: FormData) {
  const user = await requireUser();
  const d = db();
  const found = await getApplication(d, user.id, appId);
  if (!found) throw new Error("ไม่พบรายการนี้");

  const type = fd.get("type");
  const occurredOn = str(fd, "occurredOn");
  if (!isEventType(type) || !isDate(occurredOn)) throw new Error("ข้อมูลไม่ครบ");
  const atTime = str(fd, "atTime", 5);
  const mode = str(fd, "mode", 10);
  const isInterview = type === "interview";

  await d.insert(events).values({
    id: crypto.randomUUID(),
    applicationId: appId,
    userId: user.id,
    type,
    occurredOn,
    atTime: isTime(atTime) ? atTime : null,
    round: isInterview ? int(fd, "round", 1, 20) : null,
    mode: isInterview && (mode === "onsite" || mode === "online") ? mode : null,
    location: isInterview ? str(fd, "location", 500) : null,
    note: str(fd, "note", 2000),
  });
  // มีความเคลื่อนไหวใหม่ → ยกเลิก snooze
  await d.update(applications).set({ snoozedUntil: null }).where(and(eq(applications.id, appId), eq(applications.userId, user.id)));
  await recomputeApplication(d, user.id, appId);
  revalidatePath("/", "layout");
  redirect(`/apps/${appId}`);
}

export async function deleteEvent(appId: string, eventId: string) {
  const user = await requireUser();
  const d = db();
  await d.delete(events).where(and(eq(events.id, eventId), eq(events.userId, user.id), eq(events.applicationId, appId)));
  await recomputeApplication(d, user.id, appId);
  revalidatePath("/", "layout");
}

/** "ไว้ทีหลัง" — ปิดเตือนรายการนี้ 7 วัน */
export async function snooze(appId: string) {
  const user = await requireUser();
  await db()
    .update(applications)
    .set({ snoozedUntil: addDays(todayBkk(), 7) })
    .where(and(eq(applications.id, appId), eq(applications.userId, user.id)));
  revalidatePath("/");
}

/** "ย้ายเป็นเงียบ" — เพิ่มเหตุการณ์ ghosted วันนี้ */
export async function markGhosted(appId: string) {
  const user = await requireUser();
  const d = db();
  const found = await getApplication(d, user.id, appId);
  if (!found) return;
  await d.insert(events).values({
    id: crypto.randomUUID(),
    applicationId: appId,
    userId: user.id,
    type: "ghosted",
    occurredOn: todayBkk(),
  });
  await recomputeApplication(d, user.id, appId);
  revalidatePath("/", "layout");
}

export async function saveSettings(fd: FormData) {
  const user = await requireUser();
  const followDays = int(fd, "followDays", 1, 120);
  const ghostDays = int(fd, "ghostDays", 2, 365);
  const soonDays = int(fd, "soonDays", 0, 14);
  const notifyHour = int(fd, "notifyHour", 0, 23);
  if (followDays === null || ghostDays === null || soonDays === null || notifyHour === null) throw new Error("ค่าที่ตั้งไม่ถูกต้อง");
  await db()
    .update(users)
    .set({ followDays, ghostDays: Math.max(ghostDays, followDays + 1), soonDays, notifyHour, lineNotify: fd.get("lineNotify") === "on" })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
}

export async function sendTestMessage(): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  return pushLine(env().LINE_MESSAGING_CHANNEL_ACCESS_TOKEN, user.id, [
    { type: "text", text: "✅ wheremycv ส่งแจ้งเตือนเข้า LINE ได้แล้ว" },
  ]);
}

// ---------- Blacklist ----------

export async function addToBlacklist(fd: FormData) {
  const user = await requireUser();
  const company = str(fd, "company");
  if (!company) throw new Error("กรอกชื่อบริษัท");
  const key = companyKey(company) || company.toLowerCase();
  await db()
    .insert(blacklist)
    .values({ id: crypto.randomUUID(), userId: user.id, company, companyKey: key, reason: str(fd, "reason", 1000) })
    .onConflictDoUpdate({ target: [blacklist.userId, blacklist.companyKey], set: { company, reason: str(fd, "reason", 1000) } });
  revalidatePath("/", "layout");
  const back = str(fd, "back", 200);
  redirect(back && back.startsWith("/") && !back.startsWith("//") ? back : "/blacklist");
}

export async function removeFromBlacklist(id: string) {
  const user = await requireUser();
  await db().delete(blacklist).where(and(eq(blacklist.id, id), eq(blacklist.userId, user.id)));
  revalidatePath("/", "layout");
}
