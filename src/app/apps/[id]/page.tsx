import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEvent } from "@/app/actions";
import { ExternalLink } from "@/components/ExternalLink";
import { IconEdit, IconPlus } from "@/components/icons";
import { ConfirmButton } from "@/components/SubmitButton";
import { BackBar, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { calEventFor } from "@/lib/cal-event";
import { googleCalendarUrl } from "@/lib/calendar-links";
import { fmtDow, fmtLong, relDay, todayBkk } from "@/lib/dates";
import { db, env } from "@/lib/env";
import { signIcs } from "@/lib/ics-sign";
import { companyKey } from "@/lib/company";
import { getApplication, listBlacklist } from "@/lib/queries";
import { EVENT_META, isEventType, sortEvents } from "@/lib/status";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const d = db();
  const [found, bl] = await Promise.all([getApplication(d, user.id, id), listBlacklist(d, user.id)]);
  if (!found) notFound();
  const { app } = found;
  const blocked = bl.find((b) => b.companyKey === (companyKey(app.company) || app.company.toLowerCase()));
  const e = env();
  const today = todayBkk();
  const liffId = e.LIFF_ID ?? null;

  const timeline = await Promise.all(
    sortEvents(found.events).map(async (ev) => {
      const type = isEventType(ev.type) ? ev.type : "note";
      const meta = EVENT_META[type];
      const upcoming = (type === "interview" || type === "assignment") && ev.occurredOn >= today;
      const title =
        type === "interview" ? `สัมภาษณ์${ev.round ? `รอบ ${ev.round}` : ""}` : type === "assignment" ? "Assignment (กำหนดส่ง)" : meta.label;
      const where = [ev.mode === "online" ? "Online" : ev.mode === "onsite" ? "Onsite" : null, ev.location].filter(Boolean).join(" · ");
      return {
        ev,
        meta,
        upcoming,
        title,
        detail: [where, ev.note].filter(Boolean).join(" — "),
        mark: type === "interview" && ev.round ? String(ev.round) : "",
        gcal: upcoming ? googleCalendarUrl(calEventFor(ev, app)) : null,
        ics: upcoming ? `/api/ics/${ev.id}?sig=${await signIcs(ev.id, e.AUTH_SECRET)}` : null,
      };
    }),
  );

  const chips = [app.channel, app.salaryExpected && `ขอ ${app.salaryExpected}`, app.salaryOffered && `เสนอ ${app.salaryOffered}`].filter(Boolean) as string[];
  const contact = [app.contactName, app.contactEmail, app.contactPhone].filter(Boolean).join(" · ");

  return (
    <>
      <BackBar
        href="/"
        right={
          <Link href={`/apps/${id}/edit`} aria-label="แก้ไข" className="flex h-11 w-11 items-center justify-center text-ink">
            <IconEdit size={20} />
          </Link>
        }
      />
      <main className="flex flex-col gap-4 px-5 pb-32 pt-1">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold leading-tight">{app.company}</h1>
          <div className="text-[15px] text-muted">{app.position}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusBadge status={app.status} />
            {chips.map((c) => (
              <span key={c} className="rounded-[10px] border border-line bg-white px-2.5 py-1 text-xs text-ink-2">
                {c}
              </span>
            ))}
          </div>
        </div>

        <section className="card px-4 pb-1 pt-4" aria-label="Timeline">
          <h2 className="mb-3 text-[13px] font-semibold text-muted">Timeline</h2>
          <ol>
            <TimelineItem first={false} last={timeline.length === 0} dot="bg-[#EEF0F3] text-[#4A5160]" date={fmtDow(app.appliedOn)} title="ส่ง CV" detail={app.channel ? `ผ่าน ${app.channel}` : ""} />
            {timeline.map((t, i) => (
              <TimelineItem
                key={t.ev.id}
                first={false}
                last={i === timeline.length - 1}
                dot={t.meta.dot}
                dashed={t.upcoming}
                mark={t.mark}
                date={`${fmtDow(t.ev.occurredOn)}${t.ev.atTime ? ` · ${t.ev.atTime}` : ""}`}
                title={t.title}
                detail={t.detail}
              >
                {t.upcoming && (
                  <div className="mt-1.5 flex flex-col gap-2">
                    <span className="self-start rounded-lg bg-ink px-2 py-0.5 text-xs font-semibold text-white">{relDay(t.ev.occurredOn, today)}</span>
                    <div className="flex flex-wrap gap-2">
                      <ExternalLink href={t.gcal!} liffId={liffId} className="flex h-9 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] text-ink">
                        Google Calendar
                      </ExternalLink>
                      <ExternalLink href={t.ics!} liffId={liffId} className="flex h-9 items-center rounded-[10px] border border-line bg-white px-3 text-[13px] text-ink">
                        ไฟล์ .ics
                      </ExternalLink>
                    </div>
                  </div>
                )}
                <form action={deleteEvent.bind(null, id, t.ev.id)}>
                  <ConfirmButton message="ลบเหตุการณ์นี้?" className="mt-1 text-xs text-muted underline-offset-2 hover:underline">
                    ลบ
                  </ConfirmButton>
                </form>
              </TimelineItem>
            ))}
          </ol>
        </section>

        {blocked ? (
          <Link href="/blacklist" className="rounded-2xl border border-[#F2C4C4] bg-[#FDE7E7] px-4 py-3 text-[13px] leading-relaxed text-[#7A1F1F]">
            <b>บริษัทนี้อยู่ใน Blacklist</b> (เพิ่มเมื่อ {fmtLong(blocked.createdAt.slice(0, 10))})
            {blocked.reason && <span className="block whitespace-pre-line">เหตุผล: {blocked.reason}</span>}
          </Link>
        ) : null}

        {(contact || app.jobUrl || app.note) && (
          <section className="card px-4 py-1 text-sm">
            {contact && (
              <div className="flex justify-between gap-4 border-b border-hair py-3 last:border-0">
                <span className="shrink-0 text-muted">ผู้ติดต่อ</span>
                <span className="text-right">{contact}</span>
              </div>
            )}
            {app.jobUrl && (
              <div className="flex justify-between gap-4 border-b border-hair py-3 last:border-0">
                <span className="text-muted">ประกาศงาน</span>
                <ExternalLink href={app.jobUrl} liffId={liffId} className="text-brand">
                  เปิดลิงก์
                </ExternalLink>
              </div>
            )}
            {app.note && <p className="whitespace-pre-line py-3 text-ink-2">{app.note}</p>}
          </section>
        )}

        {!blocked && (
          <Link
            href={`/blacklist?add=${encodeURIComponent(app.company)}&back=${encodeURIComponent(`/apps/${id}`)}`}
            className="self-center py-2 text-[13px] text-muted underline-offset-2 hover:underline"
          >
            ไม่อยากสมัครที่นี่อีก? เพิ่มใน Blacklist
          </Link>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#E6E8EC] bg-ground px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
        <Link href={`/apps/${id}/update`} className="btn-primary mx-auto max-w-[440px]">
          <IconPlus size={20} />
          อัปเดตความคืบหน้า
        </Link>
      </div>
    </>
  );
}

function TimelineItem({
  last,
  dot,
  dashed,
  mark,
  date,
  title,
  detail,
  children,
}: {
  first: boolean;
  last: boolean;
  dot: string;
  dashed?: boolean;
  mark?: string;
  date: string;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex w-7 flex-col items-center">
        <div
          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${dashed ? "border-2 border-dashed border-[#C77A12] bg-white text-[#8A4B00]" : dot}`}
          aria-hidden="true"
        >
          {mark}
        </div>
        {!last && <div className="min-h-4 w-0.5 flex-1 bg-[#E1E4EA]" />}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pb-4">
        <div className="text-xs text-muted">{date}</div>
        <div className="text-[15px] font-semibold">{title}</div>
        {detail && <div className="text-[13px] leading-relaxed text-ink-2">{detail}</div>}
        {children}
      </div>
    </li>
  );
}
