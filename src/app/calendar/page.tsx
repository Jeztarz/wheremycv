import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { IconBack, IconNext } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { DOW_HEADERS, fmtDow, fmtMonth, todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { listApplications, listEvents } from "@/lib/queries";
import { EVENT_META, isEventType } from "@/lib/status";

const KIND_COLOR = { interview: "#C77A12", due: "#6B3FB8", other: "#8A93A3" };

type Item = { appId: string; title: string; sub: string; color: string; sort: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayBkk();
  const ym = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : today.slice(0, 7);
  const [year, month] = ym.split("-").map(Number);
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(sp.d ?? "") ? sp.d! : today.startsWith(ym) ? today : `${ym}-01`;

  const d = db();
  const [apps, evs] = await Promise.all([listApplications(d, user.id), listEvents(d, user.id)]);
  const byApp = new Map(apps.map((a) => [a.id, a]));

  // รวมรายการต่อวัน: วันที่ส่ง CV + ทุกเหตุการณ์
  const byDay = new Map<string, Item[]>();
  const add = (date: string, it: Item) => byDay.set(date, [...(byDay.get(date) ?? []), it]);
  for (const a of apps) add(a.appliedOn, { appId: a.id, title: `ส่ง CV · ${a.company}`, sub: a.position, color: KIND_COLOR.other, sort: "" });
  for (const e of evs) {
    const a = byApp.get(e.applicationId);
    if (!a || !isEventType(e.type)) continue;
    const label = e.type === "interview" ? `สัมภาษณ์${e.round ? `รอบ ${e.round}` : ""}` : e.type === "assignment" ? "ส่ง Assignment" : EVENT_META[e.type].label;
    const color = e.type === "interview" ? KIND_COLOR.interview : e.type === "assignment" ? KIND_COLOR.due : KIND_COLOR.other;
    const sub = [e.atTime, e.mode === "online" ? "Online" : e.mode === "onsite" ? "Onsite" : null, e.location].filter(Boolean).join(" · ") || a.position;
    add(e.occurredOn, { appId: a.id, title: `${label} · ${a.company}`, sub, color, sort: e.atTime ?? "" });
  }

  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${ym}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);

  const prev = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const items = [...(byDay.get(selected) ?? [])].sort((a, b) => a.sort.localeCompare(b.sort));

  return (
    <>
      <header className="flex items-center justify-between pb-2 pl-5 pr-3 pt-5">
        <h1 className="text-[22px] font-bold">{fmtMonth(year, month)}</h1>
        <div className="flex">
          <Link href={`/calendar?m=${prev}`} aria-label="เดือนก่อน" className="flex h-11 w-11 items-center justify-center">
            <IconBack size={20} />
          </Link>
          <Link href={`/calendar?m=${next}`} aria-label="เดือนถัดไป" className="flex h-11 w-11 items-center justify-center">
            <IconNext size={20} />
          </Link>
        </div>
      </header>

      <main className="flex flex-col gap-2 px-4 pb-28">
        <div className="card px-2 py-3">
          <div className="grid grid-cols-7 pb-1.5 text-center text-xs text-muted">
            {DOW_HEADERS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((date, i) => {
              if (!date) return <span key={`x${i}`} />;
              const dayItems = byDay.get(date) ?? [];
              const isSel = date === selected;
              const isToday = date === today;
              return (
                <Link
                  key={date}
                  href={`/calendar?m=${ym}&d=${date}`}
                  scroll={false}
                  aria-label={`${fmtDow(date)}${dayItems.length ? ` มี ${dayItems.length} รายการ` : ""}`}
                  aria-current={isSel ? "date" : undefined}
                  className={`flex h-12 flex-col items-center justify-center gap-[3px] rounded-xl text-sm ${isSel ? "bg-brand font-bold text-white" : isToday ? "bg-[#E3EDFF] font-bold" : ""}`}
                >
                  <span>{Number(date.slice(8))}</span>
                  <span className="flex h-1.5 gap-[3px]">
                    {dayItems.slice(0, 3).map((it, j) => (
                      <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: isSel ? "#fff" : it.color }} />
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3.5 px-1 py-1 text-xs text-ink-2">
          <Legend color={KIND_COLOR.interview} label="สัมภาษณ์" />
          <Legend color={KIND_COLOR.due} label="กำหนดส่ง" />
          <Legend color={KIND_COLOR.other} label="อื่นๆ" />
        </div>

        <h2 className="px-1 pt-1 text-sm font-semibold text-ink-2">
          {fmtDow(selected)}
          {selected === today ? " · วันนี้" : ""}
        </h2>
        {items.length === 0 && <p className="px-1 py-4 text-sm text-muted">ไม่มีรายการในวันนี้</p>}
        {items.map((it, i) => (
          <Link key={i} href={`/apps/${it.appId}`} className="card flex items-center gap-3 px-3.5 py-3">
            <span className="w-1 self-stretch rounded-sm" style={{ background: it.color }} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{it.title}</span>
              <span className="text-[13px] text-muted">{it.sub}</span>
            </span>
          </Link>
        ))}
      </main>
      <BottomNav />
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
