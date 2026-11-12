import { describe, expect, it, vi } from "vitest";
import { isAllowed, parseAllowlist, secretKey, signSession, verifyLineIdToken, verifySession } from "./auth-core";

const SECRET = "x".repeat(32);
const OWNER = "U" + "a".repeat(32);
const OTHER = "U" + "b".repeat(32);

describe("allowlist (S3: fail-closed)", () => {
  it("ค่าว่างหรือไม่ได้ตั้ง = ไม่มีใครเข้าได้", () => {
    expect(isAllowed(OWNER, undefined)).toBe(false);
    expect(isAllowed(OWNER, "")).toBe(false);
    expect(isAllowed(OWNER, " , ")).toBe(false);
  });
  it("ไม่รับค่าที่ไม่ใช่ LINE userId เช่น * หรือ all", () => {
    expect(parseAllowlist("*,all,true").size).toBe(0);
    expect(isAllowed("*", "*")).toBe(false);
  });
  it("อนุญาตเฉพาะ id ที่อยู่ในลิสต์", () => {
    expect(isAllowed(OWNER, ` ${OWNER} , ${OTHER}`)).toBe(true);
    expect(isAllowed(OTHER, OWNER)).toBe(false);
  });
});

describe("session (S4)", () => {
  it("ไม่ยอมทำงานถ้า AUTH_SECRET ไม่มีหรือสั้นเกินไป", () => {
    expect(() => secretKey(undefined)).toThrow();
    expect(() => secretKey("short")).toThrow();
  });
  it("session ที่เซ็นด้วย secret เดียวกันและอยู่ใน allowlist ผ่าน", async () => {
    const t = await signSession(OWNER, SECRET);
    expect(await verifySession(t, SECRET, OWNER)).toBe(OWNER);
  });
  it("session จากการติดตั้งอื่น (secret คนละตัว) ใช้ไม่ได้", async () => {
    const t = await signSession(OWNER, "y".repeat(32));
    expect(await verifySession(t, SECRET, OWNER)).toBeNull();
  });
  it("ถูกเอาออกจาก allowlist แล้ว session เดิมใช้ไม่ได้ทันที", async () => {
    const t = await signSession(OWNER, SECRET);
    expect(await verifySession(t, SECRET, OTHER)).toBeNull();
  });
  it("session หมดอายุใช้ไม่ได้", async () => {
    const t = await signSession(OWNER, SECRET, Date.now() - 31 * 24 * 3600 * 1000);
    expect(await verifySession(t, SECRET, OWNER)).toBeNull();
  });
  it("token มั่วหรือแก้ไขใช้ไม่ได้", async () => {
    const t = await signSession(OWNER, SECRET);
    expect(await verifySession(t.slice(0, -2) + "xx", SECRET, OWNER)).toBeNull();
    expect(await verifySession("abc", SECRET, OWNER)).toBeNull();
    expect(await verifySession(undefined, SECRET, OWNER)).toBeNull();
  });
});

describe("verifyLineIdToken (S2)", () => {
  const ok = (body: object) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;

  it("ส่ง client_id ของ channel นี้ไปให้ LINE ตรวจ", async () => {
    const f = ok({ iss: "https://access.line.me", aud: "123", sub: OWNER, name: "me" });
    const p = await verifyLineIdToken("tok", "123", f);
    expect(p?.userId).toBe(OWNER);
    const body = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].body as URLSearchParams;
    expect(body.get("client_id")).toBe("123");
  });
  it("token ของ channel อื่น (aud ไม่ตรง) ไม่ผ่าน", async () => {
    expect(await verifyLineIdToken("tok", "123", ok({ iss: "https://access.line.me", aud: "999", sub: OWNER }))).toBeNull();
  });
  it("LINE ตอบว่า token ไม่ถูกต้อง → ไม่ผ่าน", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 400 })) as unknown as typeof fetch;
    expect(await verifyLineIdToken("tok", "123", f)).toBeNull();
  });
  it("ไม่ได้ตั้ง channel id → ไม่ผ่านและไม่เรียก LINE", async () => {
    const f = vi.fn() as unknown as typeof fetch;
    expect(await verifyLineIdToken("tok", undefined, f)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
