export const STATUSES = ["sent", "replied", "interview", "interviewed", "offer", "rejected", "withdrawn", "ghosted"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<Status, { label: string; badge: string; closed: boolean }> = {
  sent: { label: "ส่งแล้ว", badge: "bg-[#EEF0F3] text-[#4A5160]", closed: false },
  replied: { label: "ตอบกลับแล้ว", badge: "bg-[#E3EDFF] text-[#1F4FBF]", closed: false },
  interview: { label: "นัดสัมภาษณ์", badge: "bg-[#FFEBCC] text-[#8A4B00]", closed: false },
  interviewed: { label: "สัมภาษณ์แล้ว", badge: "bg-[#F1E8FF] text-[#6B3FB8]", closed: false },
  offer: { label: "ได้ Offer", badge: "bg-[#DDF5E6] text-[#17703F]", closed: true },
  rejected: { label: "ไม่ผ่าน", badge: "bg-[#FDE7E7] text-[#A12828]", closed: true },
  withdrawn: { label: "ถอนตัว", badge: "bg-[#ECEAE6] text-[#5F5B54]", closed: true },
  ghosted: { label: "เงียบ", badge: "bg-[#ECEAE6] text-[#5F5B54]", closed: true },
};

export const EVENT_TYPES = ["replied", "interview", "interviewed", "assignment", "offer", "rejected", "withdrawn", "ghosted", "note"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_META: Record<EventType, { label: string; status: Status | null; dot: string }> = {
  replied: { label: "ตอบกลับแล้ว", status: "replied", dot: "bg-[#E3EDFF] text-[#1F4FBF]" },
  interview: { label: "นัดสัมภาษณ์", status: "interview", dot: "bg-[#FFEBCC] text-[#8A4B00]" },
  interviewed: { label: "สัมภาษณ์แล้ว", status: "interviewed", dot: "bg-[#F1E8FF] text-[#6B3FB8]" },
  assignment: { label: "Assignment", status: "replied", dot: "bg-[#F1E8FF] text-[#6B3FB8]" },
  offer: { label: "ได้ Offer", status: "offer", dot: "bg-[#DDF5E6] text-[#17703F]" },
  rejected: { label: "ไม่ผ่าน", status: "rejected", dot: "bg-[#FDE7E7] text-[#A12828]" },
  withdrawn: { label: "ถอนตัว", status: "withdrawn", dot: "bg-[#ECEAE6] text-[#5F5B54]" },
  ghosted: { label: "เงียบไป", status: "ghosted", dot: "bg-[#ECEAE6] text-[#5F5B54]" },
  note: { label: "โน้ต", status: null, dot: "bg-[#EEF0F3] text-[#4A5160]" },
};

export const CHANNELS = ["JobsDB", "LinkedIn", "JobThai", "อีเมล", "เว็บบริษัท", "คนรู้จัก", "อื่นๆ"];

export function isStatus(s: unknown): s is Status {
  return typeof s === "string" && (STATUSES as readonly string[]).includes(s);
}
export function isEventType(s: unknown): s is EventType {
  return typeof s === "string" && (EVENT_TYPES as readonly string[]).includes(s);
}

type EventLike = { type: string; occurredOn: string; atTime: string | null; createdAt: string };

/** เรียงเหตุการณ์ตามเวลา: เก่าอยู่บน ใหม่อยู่ล่าง */
export function sortEvents<T extends EventLike>(evs: T[]): T[] {
  return [...evs].sort(
    (a, b) =>
      a.occurredOn.localeCompare(b.occurredOn) ||
      (a.atTime ?? "").localeCompare(b.atTime ?? "") ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

/**
 * สถานะของการ์ด = สถานะของเหตุการณ์ล่าสุดที่เปลี่ยนสถานะได้ (โน้ตไม่นับ)
 * วันที่มีกิจกรรมล่าสุด = เหตุการณ์ล่าสุดที่ไม่เกินวันนี้ (นัดในอนาคตไม่นับ) หรือวันที่ส่ง
 */
export function deriveStatus(appliedOn: string, evs: EventLike[], today: string): { status: Status; lastActivityOn: string } {
  let status: Status = "sent";
  let lastActivityOn = appliedOn;
  for (const e of sortEvents(evs)) {
    if (!isEventType(e.type)) continue;
    const s = EVENT_META[e.type].status;
    if (s) status = s;
    if (e.occurredOn <= today && e.occurredOn > lastActivityOn) lastActivityOn = e.occurredOn;
  }
  return { status, lastActivityOn };
}

/** เลขรอบสัมภาษณ์ถัดไป */
export function nextRound(evs: { type: string; round: number | null }[]): number {
  const rounds = evs.filter((e) => e.type === "interview").map((e) => e.round ?? 0);
  return rounds.length ? Math.max(...rounds) + 1 : 1;
}
