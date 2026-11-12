import Link from "next/link";
import { markGhosted, snooze } from "@/app/actions";
import { BottomNav } from "@/components/BottomNav";
import { IconAlert, IconNext, IconPlus } from "@/components/icons";
import { LoginScreen } from "@/components/LoginScreen";
import { StatusBadge } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { daysBetween, fmtShort, relDay, todayBkk } from "@/lib/dates";
import { db, env } from "@/lib/env";
import { listApplications, listEvents } from "@/lib/queries";
import { computeReminders, withFreshActivity, type Reminder } from "@/lib/reminders";
import { STATUS_META, isStatus } from "@/lib/status";

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "กำลังลุ้น" },
  { id: "offer", label: "Offer" },
  { id: "closed", label: "ปิดแล้ว" },
] as const;

function group(status: string) {
  if (status === "offer") return "offer";
  return isStatus(status) && STATUS_META[status].closed ? "closed" : "active";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const user = await currentUser();
  if (!user) {
    return <LoginScreen liffId={env().LIFF_ID ?? null} devLogin={process.env.NODE_ENV === "development"} />;
  }

  const { f = "all", q = "" } = await searchParams;
  const d = db();
  const today = todayBkk();
  const [apps, evs] = await Promise.all([listApplications(d, user.id), listEvents(d, user.id)]);
  const reminders = computeReminders(withFreshActivity(apps, evs, today), evs, user, today);
  const upcoming = reminders.filter((r) => r.kind === "upcoming");
  const waiting: Reminder[] = reminders.filter((r) => r.kind !== "upcoming");

  const counts = { all: apps.length, active: 0, offer: 0, closed: 0 };
  for (const a of apps) counts[group(a.status)]++;
  const query = q.trim().toLowerCase();
  const shown = apps.filter(
    (a) => (f === "all" || group(a.status) === f) && (!query || `${a.company} ${a.position}`.toLowerCase().includes(query)),
  );

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex flex-col gap-0.5">
          <div className="text-[13px] text-muted">wheremycv</div>
          <h1 className="text-[22px] font-bold">CV ของฉัน</h1>
        </div>
        {user.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.pictureUrl} alt={user.displayName} className="h-10 w-10 rounded-full" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCE3F5] font-semibold text-brand" aria-hidden="true">
            {user.displayName.slice(0, 1) || "ฉ"}
          </div>
        )}
      </header>

      <main className="flex flex-col gap-3 px-4 pb-40">
        {upcoming[0]?.kind === "upcoming" && (
          <Link href={`/apps/${upcoming[0].appId}`} className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-white">
            <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-white leading-tight text-ink">
              <span className="text-[10px]">{fmtShort(upcoming[0].date).split(" ")[1]}</span>
              <span className="text-lg font-bold">{fmtShort(upcoming[0].date).split(" ")[0]}</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="text-xs text-[#C9CDD6]">
                นัดถัดไป · {relDay(upcoming[0].date, today)}
                {upcoming[0].time ? ` ${upcoming[0].time}` : ""}
                {upcoming.length > 1 ? ` · และอีก ${upcoming.length - 1} นัด` : ""}
              </div>
              <div className="text-[15px] font-semibold">
                {upcoming[0].title} · {upcoming[0].company}
              </div>
            </div>
            <IconNext size={20} />
          </Link>
        )}

        {waiting.length > 0 && (
          <section className="flex flex-col gap-2.5 rounded-2xl border border-warn-line bg-warn-bg px-3.5 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-warn-ink">
              <IconAlert size={16} />
              ต้องติดตาม {waiting.length} ที่
            </h2>
            {waiting.map((r) =>
              r.kind === "upcoming" ? null : (
                <div key={`${r.kind}-${r.appId}`} className="flex items-center gap-2">
                  <Link href={`/apps/${r.appId}`} className="flex-1 text-[13px] leading-snug">
                    <b>{r.company}</b>
                    <br />
                    <span className="text-[#6B5428]">
                      {r.kind === "follow" ? `ไม่มีความเคลื่อนไหว ${r.days} วัน ลองทักไปถาม` : `เงียบไป ${r.days} วัน น่าจะไม่ตอบแล้ว`}
                    </span>
                  </Link>
                  {r.kind === "ghost" && (
                    <form action={markGhosted.bind(null, r.appId)}>
                      <button className="h-9 rounded-[10px] bg-warn-ink px-3 text-[13px] text-white">ย้ายเป็นเงียบ</button>
                    </form>
                  )}
                  <form action={snooze.bind(null, r.appId)}>
                    <button className="h-9 rounded-[10px] border border-[#E2C88F] bg-white px-3 text-[13px] text-warn-ink">ไว้ทีหลัง</button>
                  </form>
                </div>
              ),
            )}
          </section>
        )}

        {apps.length > 0 && (
          <>
            <form className="flex gap-2" action="/">
              {f !== "all" && <input type="hidden" name="f" value={f} />}
              <label className="sr-only" htmlFor="q">
                ค้นหา
              </label>
              <input id="q" name="q" defaultValue={q} placeholder="ค้นหาบริษัทหรือตำแหน่ง" className="field h-10 rounded-full" />
            </form>
            <nav className="flex gap-2 overflow-x-auto" aria-label="กรองตามสถานะ">
              {FILTERS.map((it) => {
                const on = f === it.id;
                const href = it.id === "all" ? (q ? `/?q=${encodeURIComponent(q)}` : "/") : `/?f=${it.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
                return (
                  <Link
                    key={it.id}
                    href={href}
                    aria-current={on ? "true" : undefined}
                    className={`flex h-[34px] shrink-0 items-center rounded-full border px-3 text-[13px] ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2"}`}
                  >
                    {it.label} {counts[it.id]}
                  </Link>
                );
              })}
            </nav>
          </>
        )}

        <ul className="flex flex-col gap-2.5">
          {shown.map((a) => (
            <li key={a.id}>
              <Link href={`/apps/${a.id}`} className="card flex flex-col gap-1.5 px-4 py-3.5 shadow-[0_1px_2px_rgba(22,24,29,0.06)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-base font-semibold">{a.company}</span>
                    <span className="truncate text-[13px] text-muted">{a.position}</span>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="text-xs text-muted">
                  ส่ง {fmtShort(a.appliedOn)} · ผ่านมา {daysBetween(a.appliedOn, today)} วัน
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {apps.length === 0 && (
          <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
            <p className="font-semibold">ยังไม่มีรายการ</p>
            <p className="text-sm text-muted">กด “เพิ่ม” เพื่อจดว่าส่ง CV ไปที่ไหนแล้วบ้าง</p>
          </div>
        )}
        {apps.length > 0 && shown.length === 0 && <p className="py-6 text-center text-sm text-muted">ไม่มีรายการที่ตรงกับตัวกรอง</p>}
      </main>

      <Link
        href="/apps/new"
        className="fixed bottom-[92px] right-[max(20px,calc(50vw-220px))] z-10 flex h-13 items-center gap-1.5 rounded-full bg-brand px-5 font-semibold text-white shadow-[0_6px_16px_rgba(36,73,184,0.35)]"
      >
        <IconPlus size={20} />
        เพิ่ม
      </Link>
      <BottomNav />
    </>
  );
}
