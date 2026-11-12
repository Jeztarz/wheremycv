// วันที่ทั้งหมดเก็บเป็นสตริง YYYY-MM-DD ตามเวลาไทย (Asia/Bangkok ไม่มี DST = UTC+7 ตลอด)

export const TZ = "Asia/Bangkok";
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** วันนี้ (เวลาไทย) เป็น YYYY-MM-DD */
export function todayBkk(now: Date = new Date()): string {
  return new Date(now.getTime() + BKK_OFFSET_MS).toISOString().slice(0, 10);
}

/** ชั่วโมงปัจจุบัน (เวลาไทย) 0–23 */
export function hourBkk(now: Date = new Date()): number {
  return new Date(now.getTime() + BKK_OFFSET_MS).getUTCHours();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** จำนวนวันจาก a ถึง b (b - a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function isDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function isTime(s: unknown): s is string {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_DOW = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

/** "20 ต.ค." */
export function fmtShort(date: string): string {
  const { m, d } = parts(date);
  return `${d} ${TH_MONTHS[m - 1]}`;
}

/** "อ. 20 ต.ค." */
export function fmtDow(date: string): string {
  const { m, d, dow } = parts(date);
  return `${TH_DOW[dow]} ${d} ${TH_MONTHS[m - 1]}`;
}

/** "20 ต.ค. 2569" */
export function fmtLong(date: string): string {
  const { y, m, d } = parts(date);
  return `${d} ${TH_MONTHS[m - 1]} ${y + 543}`;
}

/** "พฤศจิกายน 2569" */
export function fmtMonth(year: number, month: number): string {
  return `${TH_MONTHS_FULL[month - 1]} ${year + 543}`;
}

/** "วันนี้" / "พรุ่งนี้" / "อีก 3 วัน" / "3 วันก่อน" */
export function relDay(date: string, today: string): string {
  const n = daysBetween(today, date);
  if (n === 0) return "วันนี้";
  if (n === 1) return "พรุ่งนี้";
  if (n === -1) return "เมื่อวาน";
  return n > 0 ? `อีก ${n} วัน` : `${-n} วันก่อน`;
}

export const DOW_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
