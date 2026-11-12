// ส่วนของระบบล็อกอินที่ไม่ผูกกับ Next.js — แยกไว้เพื่อให้ test ได้ (requirements S2–S5)
import { jwtVerify, SignJWT } from "jose";

/** ชื่อ cookie ใช้ prefix __Host- : ห้ามมี Domain, ต้อง Secure, Path=/ → ใช้ได้เฉพาะโฮสต์นี้ (S10) */
export const SESSION_COOKIE = "__Host-wheremycv_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ISSUER = "wheremycv";

/** allowlist แบบ fail-closed: ค่าว่าง = ไม่มีใครเข้าได้ (S3) */
export function parseAllowlist(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^U[0-9a-f]{32}$/i.test(s)),
  );
}

export function isAllowed(userId: string, raw: string | undefined | null): boolean {
  return parseAllowlist(raw).has(userId);
}

/** แอปต้องไม่ทำงานถ้าไม่มี AUTH_SECRET หรือสั้นกว่า 32 ตัวอักษร (S4) */
export function secretKey(secret: string | undefined | null): Uint8Array<ArrayBuffer> {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET ไม่ได้ตั้งค่า หรือสั้นกว่า 32 ตัวอักษร");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string, secret: string | undefined, now = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_TTL_SECONDS)
    .sign(secretKey(secret));
}

/** คืน userId ถ้า session ถูกต้อง ยังไม่หมดอายุ และยังอยู่ใน allowlist (ตรวจทุก request) */
export async function verifySession(
  token: string | undefined,
  secret: string | undefined,
  allowlist: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { issuer: ISSUER, algorithms: ["HS256"] });
    const sub = payload.sub;
    if (!sub || !isAllowed(sub, allowlist)) return null;
    return sub;
  } catch {
    return null;
  }
}

export type LineProfile = { userId: string; name: string; picture: string | null };

/**
 * ตรวจ LINE ID token ที่ฝั่งเซิร์ฟเวอร์กับ LINE โดยตรง (S2)
 * LINE จะเช็กลายเซ็น วันหมดอายุ และว่า token ออกให้ channel นี้ (client_id) จริง
 */
export async function verifyLineIdToken(
  idToken: string,
  channelId: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<LineProfile | null> {
  if (!channelId || !idToken) return null;
  const res = await fetchImpl("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { sub?: string; aud?: string; iss?: string; name?: string; picture?: string };
  // เช็กซ้ำอีกชั้นว่า token เป็นของ channel นี้และออกโดย LINE
  if (data.aud !== channelId || data.iss !== "https://access.line.me" || !data.sub) return null;
  return { userId: data.sub, name: data.name ?? "", picture: data.picture ?? null };
}
