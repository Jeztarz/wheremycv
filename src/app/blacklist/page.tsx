import { addToBlacklist, removeFromBlacklist } from "@/app/actions";
import { ConfirmButton, SubmitButton } from "@/components/SubmitButton";
import { BackBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysBetween, fmtLong, todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { listBlacklist } from "@/lib/queries";

function ago(date: string, today: string) {
  const days = daysBetween(date, today);
  if (days < 1) return "วันนี้";
  if (days < 60) return `${days} วันก่อน`;
  const months = Math.floor(days / 30.4);
  if (months < 24) return `${months} เดือนก่อน`;
  return `${Math.floor(months / 12)} ปีก่อน`;
}

export default async function BlacklistPage({ searchParams }: { searchParams: Promise<{ add?: string; back?: string }> }) {
  const user = await requireUser();
  const { add = "", back = "" } = await searchParams;
  const list = await listBlacklist(db(), user.id);
  const today = todayBkk();
  const safeBack = back.startsWith("/") && !back.startsWith("//") ? back : "/settings";

  return (
    <>
      <BackBar href={safeBack} />
      <div className="flex flex-col gap-0.5 px-5 pb-4">
        <h1 className="text-[22px] font-bold">Blacklist</h1>
        <p className="text-[13px] text-muted">บริษัทที่ไม่อยากสมัครอีก — ตอนกรอกชื่อบริษัทนี้ในอนาคตจะมีเตือนพร้อมเหตุผล</p>
      </div>

      <main className="flex flex-col gap-4 px-4 pb-16">
        <form action={addToBlacklist} className="card flex flex-col gap-3 p-4">
          <input type="hidden" name="back" value={add ? safeBack : "/blacklist"} />
          <label className="label">
            ชื่อบริษัท
            <input name="company" required maxLength={200} defaultValue={add} className="field" autoComplete="off" />
          </label>
          <label className="label">
            เหตุผล (ไว้เตือนตัวเองในอนาคต)
            <textarea name="reason" rows={3} maxLength={1000} placeholder="เช่น สัมภาษณ์แล้วไม่ประทับใจ, เงินเดือนต่ำกว่าตลาดมาก, HR ไม่ตอบ" className="field resize-none" autoFocus={Boolean(add)} />
          </label>
          <SubmitButton className="btn-primary h-11 text-[15px]">เพิ่มใน Blacklist</SubmitButton>
        </form>

        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีบริษัทใน Blacklist</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((b) => (
              <li key={b.id} className="card flex flex-col gap-1.5 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-base font-semibold">{b.company}</span>
                  <form action={removeFromBlacklist.bind(null, b.id)}>
                    <ConfirmButton message={`เอา ${b.company} ออกจาก Blacklist?`} className="text-xs text-muted underline-offset-2 hover:underline">
                      เอาออก
                    </ConfirmButton>
                  </form>
                </div>
                {b.reason && <p className="whitespace-pre-line text-sm text-ink-2">{b.reason}</p>}
                <div className="text-xs text-muted">
                  เพิ่มเมื่อ {fmtLong(b.createdAt.slice(0, 10))} · {ago(b.createdAt.slice(0, 10), today)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
