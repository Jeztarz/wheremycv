import { addDays, daysBetween } from "./dates";

type A = { id: string; appliedOn: string; channel: string | null; status: string };
type E = { applicationId: string; type: string; occurredOn: string };

const RESPONSE_TYPES = new Set(["replied", "interview", "interviewed", "assignment", "offer", "rejected"]);

export function computeStats(apps: A[], evs: E[], today: string) {
  const firstResponse = new Map<string, string>();
  const interviewed = new Set<string>();
  const offered = new Set<string>();
  for (const e of evs) {
    if (RESPONSE_TYPES.has(e.type)) {
      const cur = firstResponse.get(e.applicationId);
      if (!cur || e.occurredOn < cur) firstResponse.set(e.applicationId, e.occurredOn);
    }
    if (e.type === "interview" || e.type === "interviewed") interviewed.add(e.applicationId);
    if (e.type === "offer") offered.add(e.applicationId);
  }

  const total = apps.length;
  const replied = apps.filter((a) => firstResponse.has(a.id)).length;
  const gaps = apps.filter((a) => firstResponse.has(a.id)).map((a) => Math.max(0, daysBetween(a.appliedOn, firstResponse.get(a.id)!)));
  const avgReplyDays = gaps.length ? Math.round(gaps.reduce((s, n) => s + n, 0) / gaps.length) : null;

  // 8 สัปดาห์ล่าสุด (สัปดาห์เริ่มวันอาทิตย์)
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const thisWeek = addDays(today, -dow);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(thisWeek, (i - 7) * 7);
    const end = addDays(start, 6);
    return { start, count: apps.filter((a) => a.appliedOn >= start && a.appliedOn <= end).length, current: i === 7 };
  });

  const byChannel = new Map<string, { sent: number; replied: number }>();
  for (const a of apps) {
    const k = a.channel ?? "ไม่ระบุ";
    const c = byChannel.get(k) ?? { sent: 0, replied: 0 };
    c.sent++;
    if (firstResponse.has(a.id)) c.replied++;
    byChannel.set(k, c);
  }
  const channels = [...byChannel.entries()]
    .map(([name, c]) => ({ name, ...c, rate: Math.round((c.replied / c.sent) * 100) }))
    .sort((a, b) => b.rate - a.rate || b.sent - a.sent);

  return {
    total,
    replied,
    interviewed: interviewed.size,
    offers: offered.size,
    replyRate: total ? Math.round((replied / total) * 100) : 0,
    avgReplyDays,
    since: apps.reduce<string | null>((m, a) => (!m || a.appliedOn < m ? a.appliedOn : m), null),
    weeks,
    channels,
  };
}
