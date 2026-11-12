import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtLong, fmtShort, todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { listApplications, listEvents } from "@/lib/queries";
import { computeStats } from "@/lib/stats";

export default async function StatsPage() {
  const user = await requireUser();
  const d = db();
  const [apps, evs] = await Promise.all([listApplications(d, user.id), listEvents(d, user.id)]);
  const s = computeStats(apps, evs, todayBkk());
  const pct = (n: number) => (s.total ? Math.round((n / s.total) * 100) : 0);
  const funnel = [
    { label: "ส่ง CV", n: s.total },
    { label: "ได้รับการตอบกลับ", n: s.replied },
    { label: "ได้สัมภาษณ์", n: s.interviewed },
    { label: "ได้ Offer", n: s.offers },
  ];
  const maxWeek = Math.max(1, ...s.weeks.map((w) => w.count));

  return (
    <>
      <PageHeader title="สถิติของฉัน" />
      {s.since && <p className="-mt-2 px-5 pb-3 text-[13px] text-muted">ตั้งแต่ {fmtLong(s.since)}</p>}
      <main className="flex flex-col gap-3 px-4 pb-28">
        <div className="grid grid-cols-2 gap-2.5">
          <Tile label="ส่งไปแล้ว" value={s.total} unit="ที่" />
          <Tile label="อัตราตอบกลับ" value={`${s.replyRate}%`} />
          <Tile label="ตอบกลับเฉลี่ยใน" value={s.avgReplyDays ?? "–"} unit={s.avgReplyDays === null ? undefined : "วัน"} />
          <Tile label="ได้ Offer" value={s.offers} unit="ที่" />
        </div>

        <section className="card flex flex-col gap-2.5 px-4 py-3.5">
          <h2 className="text-sm font-semibold">ไปถึงขั้นไหนบ้าง</h2>
          {funnel.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-[13px]">
                <span>{f.label}</span>
                <span className="text-ink-2">
                  {f.n} ({pct(f.n)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-hair">
                <div className="h-2.5 rounded-full bg-brand" style={{ width: `${pct(f.n)}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="card flex flex-col gap-2.5 px-4 py-3.5">
          <h2 className="text-sm font-semibold">ส่งต่อสัปดาห์</h2>
          <div className="grid h-24 grid-cols-8 items-end gap-2">
            {s.weeks.map((w) => (
              <div key={w.start} className="flex h-24 flex-col items-center justify-end gap-1">
                <span className="text-[11px] text-ink-2">{w.count}</span>
                <div
                  className={`w-full rounded-t ${w.current ? "bg-[#9DB0E6]" : "bg-brand"}`}
                  style={{ height: `${Math.max(2, (w.count / maxWeek) * 70)}px` }}
                  title={`สัปดาห์ ${fmtShort(w.start)}: ${w.count} ที่`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2 text-center text-[10px] text-muted">
            {s.weeks.map((w) => (
              <span key={w.start}>{fmtShort(w.start)}</span>
            ))}
          </div>
        </section>

        {s.channels.length > 0 && (
          <section className="card px-4 py-1.5">
            <h2 className="py-2 text-sm font-semibold">ช่องทางไหนได้ผล</h2>
            {s.channels.map((c) => (
              <div key={c.name} className="flex justify-between border-t border-hair py-2.5 text-sm">
                <span>{c.name}</span>
                <span className="text-ink-2">
                  ตอบ {c.replied}/{c.sent} · <b>{c.rate}%</b>
                </span>
              </div>
            ))}
          </section>
        )}
      </main>
      <BottomNav />
    </>
  );
}

function Tile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="card p-3.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[28px] font-bold">
        {value} {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
      </div>
    </div>
  );
}
