import { users } from "@/db/schema";
import { startSession } from "@/lib/auth";
import { isAllowed } from "@/lib/auth-core";
import { db, env } from "@/lib/env";

/**
 * ล็อกอินโดยไม่ผ่าน LINE — ใช้ได้เฉพาะ `next dev` บน localhost เท่านั้น
 * ตอน build production ค่า NODE_ENV เป็น "production" route นี้จึงตอบ 404 เสมอ (S5)
 */
export async function POST(req: Request) {
  const host = new URL(req.url).hostname;
  const e = env();
  const userId = e.DEV_LOGIN_LINE_USER_ID ?? "";
  if (process.env.NODE_ENV !== "development" || (host !== "localhost" && host !== "127.0.0.1") || !isAllowed(userId, e.ALLOWED_LINE_USER_IDS)) {
    return new Response("Not found", { status: 404 });
  }
  await db().insert(users).values({ id: userId, displayName: "Dev" }).onConflictDoNothing();
  await startSession(userId);
  return Response.json({ ok: true });
}
