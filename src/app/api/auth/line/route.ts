import { users } from "@/db/schema";
import { startSession } from "@/lib/auth";
import { isAllowed, verifyLineIdToken } from "@/lib/auth-core";
import { db, env } from "@/lib/env";

/** รับ ID token จาก LIFF แล้ว verify กับ LINE ที่ฝั่งเซิร์ฟเวอร์ก่อนออก session (S2, S3) */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  const e = env();

  const profile = await verifyLineIdToken(idToken, e.LINE_LOGIN_CHANNEL_ID);
  if (!profile) return Response.json({ error: "invalid_token" }, { status: 401 });

  if (!isAllowed(profile.userId, e.ALLOWED_LINE_USER_IDS)) {
    // ส่ง userId กลับไปให้เจ้าของเอาไปใส่ allowlist ได้ (เป็นของคนที่ล็อกอินเอง ไม่ใช่ข้อมูลของคนอื่น)
    return Response.json({ error: "not_allowed", userId: profile.userId }, { status: 403 });
  }

  await db()
    .insert(users)
    .values({ id: profile.userId, displayName: profile.name, pictureUrl: profile.picture })
    .onConflictDoUpdate({ target: users.id, set: { displayName: profile.name, pictureUrl: profile.picture } });

  await startSession(profile.userId);
  return Response.json({ ok: true });
}
