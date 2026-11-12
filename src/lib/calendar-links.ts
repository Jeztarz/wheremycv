import { addDays } from "./dates";

// เพิ่มนัดลงปฏิทินส่วนตัว: ลิงก์ Google Calendar แบบกรอกให้ + ไฟล์ .ics (requirements ข้อ 7)

export type CalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (เวลาไทย)
  time: string | null; // HH:MM
  durationMin?: number;
  location?: string | null;
  details?: string | null;
};

/** แปลงเวลาไทยเป็น UTC แบบ 20261113T030000Z */
function toUtcStamp(date: string, time: string, plusMin = 0): string {
  const d = new Date(`${date}T${time}:00+07:00`);
  d.setUTCMinutes(d.getUTCMinutes() + plusMin);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function range(e: CalEvent): [string, string] {
  if (e.time) return [toUtcStamp(e.date, e.time), toUtcStamp(e.date, e.time, e.durationMin ?? 60)];
  return [e.date.replaceAll("-", ""), addDays(e.date, 1).replaceAll("-", "")];
}

export function googleCalendarUrl(e: CalEvent): string {
  const [start, end] = range(e);
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${start}/${end}` });
  if (e.details) p.set("details", e.details);
  if (e.location) p.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${p}`;
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function icsFile(e: CalEvent, now = new Date()): string {
  const [start, end] = range(e);
  const allDay = !e.time;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wheremycv//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@wheremycv`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    ...(e.details ? [`DESCRIPTION:${esc(e.details)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    allDay ? "TRIGGER:-PT7H" : "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
