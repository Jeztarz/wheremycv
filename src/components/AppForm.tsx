import Link from "next/link";
import type { Application } from "@/db/schema";
import { CHANNELS } from "@/lib/status";
import { CompanyInput, type BlockedCompany, type KnownApp } from "./CompanyInput";
import { SubmitButton } from "./SubmitButton";

/** ฟอร์มเพิ่ม/แก้ไขการสมัคร — ช่องบังคับแค่ 3 ช่อง ที่เหลือพับไว้ */
export function AppForm({
  action,
  initial,
  today,
  cancelHref,
  known,
  blocked,
}: {
  action: (fd: FormData) => Promise<void>;
  initial?: Partial<Application>;
  today: string;
  cancelHref: string;
  known: KnownApp[];
  blocked: BlockedCompany[];
}) {
  const hasExtra = Boolean(
    initial?.jobUrl || initial?.salaryExpected || initial?.salaryOffered || initial?.contactName || initial?.contactEmail || initial?.contactPhone || initial?.note,
  );
  return (
    <form action={action} className="flex flex-col gap-4 px-5 pb-10">
      <CompanyInput defaultValue={initial?.company} known={known} blocked={blocked} />
      <label className="label">
        ตำแหน่ง *
        <input name="position" required maxLength={200} defaultValue={initial?.position} className="field" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="label">
          วันที่ส่ง *
          <input type="date" name="appliedOn" required defaultValue={initial?.appliedOn ?? today} max={today} className="field" />
        </label>
        <label className="label">
          ช่องทาง
          <select name="channel" defaultValue={initial?.channel ?? ""} className="field">
            <option value="">—</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details open={hasExtra} className="card px-4 py-1">
        <summary className="cursor-pointer py-3 text-sm font-semibold text-ink-2">รายละเอียดเพิ่มเติม (ไม่บังคับ)</summary>
        <div className="flex flex-col gap-4 pb-4">
          <label className="label">
            ลิงก์ประกาศงาน
            <input type="url" name="jobUrl" defaultValue={initial?.jobUrl ?? ""} placeholder="https://" className="field" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              เงินเดือนที่ขอ
              <input name="salaryExpected" defaultValue={initial?.salaryExpected ?? ""} inputMode="numeric" className="field" />
            </label>
            <label className="label">
              บริษัทเสนอ
              <input name="salaryOffered" defaultValue={initial?.salaryOffered ?? ""} inputMode="numeric" className="field" />
            </label>
          </div>
          <label className="label">
            ผู้ติดต่อ
            <input name="contactName" defaultValue={initial?.contactName ?? ""} placeholder="เช่น คุณเอ (HR)" className="field" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              อีเมล
              <input type="email" name="contactEmail" defaultValue={initial?.contactEmail ?? ""} className="field" />
            </label>
            <label className="label">
              เบอร์โทร
              <input type="tel" name="contactPhone" defaultValue={initial?.contactPhone ?? ""} className="field" />
            </label>
          </div>
          <label className="label">
            โน้ต
            <textarea name="note" rows={3} defaultValue={initial?.note ?? ""} className="field resize-none" />
          </label>
        </div>
      </details>

      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <Link href={cancelHref} className="btn-ghost">
          ยกเลิก
        </Link>
        <SubmitButton className="btn-primary col-span-2">บันทึก</SubmitButton>
      </div>
    </form>
  );
}
