// ลิงก์ .ics แบบมีลายเซ็น: เปิดในเบราว์เซอร์ภายนอก (ซึ่งไม่มี session cookie) ได้
// โดยไม่ต้องล็อกอิน แต่เดา URL ของนัดอื่นไม่ได้ เพราะลายเซ็นผูกกับ eventId และ AUTH_SECRET

import { secretKey } from "./auth-core";

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function key(secret: string | undefined) {
  return crypto.subtle.importKey("raw", secretKey(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function signIcs(eventId: string, secret: string | undefined): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(secret), new TextEncoder().encode(`ics:${eventId}`));
  return b64url(sig);
}

export async function verifyIcs(eventId: string, sig: string | null, secret: string | undefined): Promise<boolean> {
  if (!sig) return false;
  const expected = await signIcs(eventId, secret);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
