import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { users, type User } from "@/db/schema";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./auth-core";
import { db, env } from "./env";

/** userId ของคนที่ล็อกอินอยู่ (ตรวจลายเซ็น + วันหมดอายุ + allowlist ทุกครั้ง) */
export const currentUserId = cache(async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const e = env();
  return verifySession(token, e.AUTH_SECRET, e.ALLOWED_LINE_USER_IDS);
});

export const currentUser = cache(async (): Promise<User | null> => {
  const id = await currentUserId();
  if (!id) return null;
  return (await db().query.users.findFirst({ where: eq(users.id, id) })) ?? null;
});

/** ใช้ในหน้าที่ต้องล็อกอิน — ยังไม่ล็อกอินจะส่งไปหน้าแรก (ซึ่งจะเรียก LIFF login) */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}

export async function startSession(userId: string) {
  const token = await signSession(userId, env().AUTH_SECRET);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}
