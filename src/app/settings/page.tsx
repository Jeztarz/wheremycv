import { saveSettings, sendTestMessage } from "@/app/actions";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { TestMessageButton } from "@/components/TestMessageButton";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="ตั้งค่า" />
      <main className="flex flex-col gap-4 px-4 pb-28">
        <form action={saveSettings} className="flex flex-col gap-4">
          <section className="flex flex-col gap-1.5">
            <h2 className="px-1 text-[13px] font-semibold text-muted">เตือนเมื่อ</h2>
            <div className="card px-4">
              <NumberRow name="followDays" title="ควร Follow up" desc="ไม่มีความเคลื่อนไหวเกิน" value={user.followDays} min={1} max={120} />
              <NumberRow name="ghostDays" title="ถือว่าเงียบ" desc="ไม่มีความเคลื่อนไหวเกิน" value={user.ghostDays} min={2} max={365} />
              <NumberRow name="soonDays" title="เตือนนัดล่วงหน้า" desc="ก่อนวันสัมภาษณ์ / กำหนดส่ง" value={user.soonDays} min={0} max={14} last />
            </div>
          </section>

          <section className="flex flex-col gap-1.5">
            <h2 className="px-1 text-[13px] font-semibold text-muted">แจ้งเตือนทาง LINE</h2>
            <div className="card px-4">
              <label className="flex items-center gap-3 border-b border-hair py-3">
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px]">ส่งสรุปประจำวัน</span>
                  <span className="text-xs text-muted">ส่งเฉพาะวันที่มีเรื่องต้องเตือน</span>
                </span>
                <input type="checkbox" name="lineNotify" defaultChecked={user.lineNotify} className="h-6 w-6 accent-brand" />
              </label>
              <label className="flex items-center justify-between py-3">
                <span className="text-[15px]">เวลาส่ง</span>
                <select name="notifyHour" defaultValue={user.notifyHour} className="field h-10 w-28">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00 น.
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <SubmitButton>บันทึกการตั้งค่า</SubmitButton>
        </form>

        <div className="card p-4">
          <TestMessageButton send={sendTestMessage} />
        </div>

        <section className="flex flex-col gap-1.5">
          <h2 className="px-1 text-[13px] font-semibold text-muted">บัญชี</h2>
          <div className="card flex items-center gap-3 px-4 py-3">
            {user.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.pictureUrl} alt="" className="h-11 w-11 rounded-full" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#DCE3F5]" aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold">{user.displayName || "ผู้ใช้ LINE"}</span>
              <span className="truncate text-xs text-muted">ล็อกอินด้วย LINE · {user.id}</span>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}

function NumberRow({ name, title, desc, value, min, max, last }: { name: string; title: string; desc: string; value: number; min: number; max: number; last?: boolean }) {
  return (
    <label className={`flex items-center gap-3 py-3 ${last ? "" : "border-b border-hair"}`}>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px]">{title}</span>
        <span className="text-xs text-muted">{desc}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <input type="number" name={name} defaultValue={value} min={min} max={max} required className="field h-10 w-[72px] text-center" />
        <span className="text-sm text-ink-2">วัน</span>
      </span>
    </label>
  );
}
