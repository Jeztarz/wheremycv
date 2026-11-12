"use client";

import { useState, useTransition } from "react";

export function TestMessageButton({ send }: { send: () => Promise<{ ok: boolean; error?: string }> }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await send()))}
        className="h-11 w-full rounded-xl border border-brand bg-white font-semibold text-brand disabled:opacity-60"
      >
        {pending ? "กำลังส่ง…" : "ส่งข้อความทดสอบ"}
      </button>
      {result && (
        <p role="status" className={`text-[13px] ${result.ok ? "text-[#17703F]" : "text-[#A12828]"}`}>
          {result.ok ? "ส่งแล้ว ลองเช็กใน LINE" : result.error}
        </p>
      )}
    </div>
  );
}
