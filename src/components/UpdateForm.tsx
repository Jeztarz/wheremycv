"use client";

import Link from "next/link";
import { useState } from "react";
import { EVENT_META, type EventType } from "@/lib/status";
import { SubmitButton } from "./SubmitButton";

const CHOICES: EventType[] = ["replied", "interview", "interviewed", "assignment", "offer", "rejected", "withdrawn", "note"];

export function UpdateForm({ action, today, nextRound, cancelHref }: { action: (fd: FormData) => Promise<void>; today: string; nextRound: number; cancelHref: string }) {
  const [type, setType] = useState<EventType>("replied");
  const [mode, setMode] = useState<"onsite" | "online">("onsite");
  const isInterview = type === "interview";
  const scheduled = isInterview || type === "assignment";

  return (
    <form action={action} className="flex flex-col gap-4 px-5 pb-10">
      <input type="hidden" name="type" value={type} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-ink-2">เกิดอะไรขึ้น</legend>
        <div className="flex flex-wrap gap-2">
          {CHOICES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === type}
              onClick={() => setType(t)}
              className={`h-9 rounded-full border px-3 text-[13px] ${t === type ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2"}`}
            >
              {EVENT_META[t].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={scheduled ? "grid grid-cols-2 gap-3" : ""}>
        <label className="label">
          {isInterview ? "วันนัดสัมภาษณ์" : type === "assignment" ? "กำหนดส่ง" : "วันที่"}
          <input type="date" name="occurredOn" required defaultValue={today} className="field" />
        </label>
        {scheduled && (
          <label className="label">
            เวลา
            <input type="time" name="atTime" defaultValue={isInterview ? "10:00" : ""} className="field" />
          </label>
        )}
      </div>

      {isInterview && (
        <div className="flex flex-col gap-3 rounded-2xl bg-warn-bg p-3">
          <label className="label">
            รอบที่
            <input type="number" name="round" min={1} max={20} defaultValue={nextRound} className="field border-[#E2C88F]" />
          </label>
          <input type="hidden" name="mode" value={mode} />
          <div className="grid grid-cols-2 rounded-xl border border-[#E2C88F] bg-white p-1" role="group" aria-label="รูปแบบการสัมภาษณ์">
            {(["onsite", "online"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`h-9 rounded-[9px] text-sm ${mode === m ? "bg-ink text-white" : "text-ink-2"}`}>
                {m === "onsite" ? "Onsite" : "Online"}
              </button>
            ))}
          </div>
          <label className="label">
            {mode === "online" ? "ลิงก์ประชุม" : "สถานที่"}
            <input name="location" maxLength={500} placeholder={mode === "online" ? "https://meet.google.com/…" : "เช่น ออฟฟิศสีลม ชั้น 12"} className="field border-[#E2C88F]" />
          </label>
        </div>
      )}

      <label className="label">
        โน้ต (ไม่บังคับ)
        <textarea name="note" rows={3} maxLength={2000} placeholder="เช่น HR ชื่ออะไร ต้องเตรียมอะไรไป" className="field resize-none" />
      </label>

      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <Link href={cancelHref} className="btn-ghost">
          ยกเลิก
        </Link>
        <SubmitButton className="btn-primary col-span-2">บันทึก</SubmitButton>
      </div>
    </form>
  );
}
