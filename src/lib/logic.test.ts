import { describe, expect, it } from "vitest";
import { icsFile, googleCalendarUrl } from "./calendar-links";
import { computeReminders, withFreshActivity } from "./reminders";
import { deriveStatus, nextRound } from "./status";

const ev = (type: string, occurredOn: string, extra: Partial<{ atTime: string; round: number }> = {}) => ({
  type,
  occurredOn,
  atTime: extra.atTime ?? null,
  round: extra.round ?? null,
  createdAt: "2026-01-01",
});

describe("deriveStatus", () => {
  it("ไม่มีเหตุการณ์ = ส่งแล้ว", () => {
    expect(deriveStatus("2026-10-01", [], "2026-11-12")).toEqual({ status: "sent", lastActivityOn: "2026-10-01" });
  });
  it("ใช้เหตุการณ์ล่าสุด โน้ตไม่เปลี่ยนสถานะ และนัดในอนาคตไม่นับเป็นกิจกรรม", () => {
    const r = deriveStatus("2026-10-20", [ev("replied", "2026-10-27"), ev("interview", "2026-11-13"), ev("note", "2026-11-01")], "2026-11-12");
    expect(r).toEqual({ status: "interview", lastActivityOn: "2026-11-01" });
  });
  it("nextRound นับต่อจากรอบสูงสุด", () => {
    expect(nextRound([])).toBe(1);
    expect(nextRound([{ type: "interview", round: 1 }, { type: "interview", round: 2 }])).toBe(3);
  });
});

describe("computeReminders", () => {
  const settings = { followDays: 14, ghostDays: 30, soonDays: 1 };
  const app = (id: string, status: string, lastActivityOn: string, snoozedUntil: string | null = null) => ({
    id,
    company: id,
    position: "dev",
    status,
    lastActivityOn,
    snoozedUntil,
  });
  const e = (applicationId: string, type: string, occurredOn: string) => ({ applicationId, type, occurredOn, atTime: null, round: 2, mode: "onsite", location: "สีลม" });

  it("เตือน follow up / ghost / นัดพรุ่งนี้ ตามค่าที่ตั้ง", () => {
    const r = computeReminders(
      [app("kiwi", "sent", "2026-10-25"), app("siam", "sent", "2026-10-01"), app("nava", "interview", "2026-11-06"), app("fresh", "sent", "2026-11-10")],
      [e("nava", "interview", "2026-11-13")],
      settings,
      "2026-11-12",
    );
    expect(r.map((x) => `${x.kind}:${x.appId}`)).toEqual(["upcoming:nava", "follow:kiwi", "ghost:siam"]);
  });
  it("ไม่เตือนรายการที่กด snooze ไว้ หรือปิดไปแล้ว", () => {
    const r = computeReminders([app("a", "sent", "2026-10-01", "2026-11-15"), app("b", "rejected", "2026-09-01")], [], settings, "2026-11-12");
    expect(r).toEqual([]);
  });
  it("นัดที่ผ่านไปแล้วนับเป็นกิจกรรมล่าสุด", () => {
    const apps = withFreshActivity([{ ...app("a", "interview", "2026-10-01"), appliedOn: "2026-10-01" }], [e("a", "interview", "2026-11-05")], "2026-11-12");
    expect(apps[0].lastActivityOn).toBe("2026-11-05");
  });
});

describe("calendar links", () => {
  const e = { id: "abc", title: "สัมภาษณ์รอบ 2 · นาวาซอฟต์", date: "2026-11-13", time: "10:00", durationMin: 60, location: "สีลม", details: "a,b;c" };
  it("แปลงเวลาไทยเป็น UTC (UTC+7)", () => {
    expect(googleCalendarUrl(e)).toContain("dates=20261113T030000Z%2F20261113T040000Z");
  });
  it("ไฟล์ .ics มี escape และ CRLF", () => {
    const ics = icsFile(e, new Date("2026-11-12T00:00:00Z"));
    expect(ics).toContain("DTSTART:20261113T030000Z\r\n");
    expect(ics).toContain("DESCRIPTION:a\\,b\\;c");
  });
  it("นัดทั้งวันใช้ VALUE=DATE", () => {
    expect(icsFile({ ...e, time: null })).toContain("DTSTART;VALUE=DATE:20261113");
  });
});
