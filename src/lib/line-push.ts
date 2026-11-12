// ส่งข้อความเข้า LINE ผ่าน Messaging API (ไม่ผูกกับ Next.js เพราะ cron ใน worker.ts ก็ใช้)
import { fmtDow, relDay } from "./dates";
import type { Reminder } from "./reminders";

export async function pushLine(token: string | undefined, to: string, messages: unknown[]): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "ยังไม่ได้ตั้งค่า LINE_MESSAGING_CHANNEL_ACCESS_TOKEN" };
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages }),
  });
  if (res.ok) return { ok: true };
  const body = await res.text().catch(() => "");
  if (res.status === 400 || res.status === 403) {
    return { ok: false, error: `LINE ตอบกลับ ${res.status} — เช็กว่าแอดเพื่อน LINE OA แล้ว และ Login channel กับ Messaging API อยู่ provider เดียวกัน (${body.slice(0, 200)})` };
  }
  return { ok: false, error: `LINE ตอบกลับ ${res.status}: ${body.slice(0, 200)}` };
}

const COLORS = { upcoming: "#C77A12", follow: "#8A93A3", ghost: "#8A93A3" };

function row(r: Reminder, today: string) {
  let tag: string, title: string, sub: string;
  if (r.kind === "upcoming") {
    tag = `${relDay(r.date, today)}${r.time ? ` ${r.time}` : ""}`;
    title = `${r.title} · ${r.company}`;
    sub = r.detail ?? fmtDow(r.date);
  } else if (r.kind === "follow") {
    tag = "ควร Follow up";
    title = r.company;
    sub = `ไม่มีความเคลื่อนไหว ${r.days} วัน`;
  } else {
    tag = "น่าจะเงียบแล้ว";
    title = r.company;
    sub = `${r.days} วันแล้ว ไม่มีความเคลื่อนไหว`;
  }
  return {
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: tag, size: "xs", weight: "bold", color: COLORS[r.kind] },
      { type: "text", text: title, size: "sm", weight: "bold", wrap: true },
      { type: "text", text: sub, size: "xs", color: "#5A6170", wrap: true },
    ],
  };
}

/** Flex Message สรุปประจำวัน (ดีไซน์ตามดราฟต์หน้า 7) */
export function dailySummaryMessage(reminders: Reminder[], today: string, appUrl: string) {
  const rows = reminders.slice(0, 8).flatMap((r, i) => (i === 0 ? [row(r, today)] : [{ type: "separator", margin: "md" }, row(r, today)]));
  const more = reminders.length > 8 ? [{ type: "text", text: `และอีก ${reminders.length - 8} รายการ`, size: "xs", color: "#5A6170", margin: "md" }] : [];
  return {
    type: "flex",
    altText: `wheremycv: มี ${reminders.length} เรื่องต้องดูวันนี้`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#16181D",
        contents: [
          { type: "text", text: `สรุปประจำวัน · ${fmtDow(today)}`, size: "xs", color: "#C9CDD6" },
          { type: "text", text: `มี ${reminders.length} เรื่องต้องดู`, size: "lg", weight: "bold", color: "#FFFFFF" },
        ],
      },
      body: { type: "box", layout: "vertical", spacing: "md", contents: [...rows, ...more] },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "button", style: "primary", color: "#2449B8", action: { type: "uri", label: "เปิดดูในแอป", uri: appUrl } }],
      },
    },
  };
}
