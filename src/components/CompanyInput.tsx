"use client";

import { useMemo, useState } from "react";
import { companyKey } from "@/lib/company";
import { fmtLong } from "@/lib/dates";

export type KnownApp = { company: string; position: string; appliedOn: string };
export type BlockedCompany = { company: string; reason: string | null; addedOn: string };

/** ช่องชื่อบริษัท + เตือนถ้าอยู่ใน Blacklist หรือเคยส่งไปแล้ว */
export function CompanyInput({ defaultValue, known, blocked }: { defaultValue?: string; known: KnownApp[]; blocked: BlockedCompany[] }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const key = companyKey(value);
  const companies = useMemo(() => [...new Set(known.map((k) => k.company))], [known]);

  const hitBlock = key ? blocked.find((b) => companyKey(b.company) === key) : undefined;
  const hitKnown = key ? known.filter((k) => companyKey(k.company) === key) : [];

  return (
    <div className="flex flex-col gap-2">
      <label className="label">
        ชื่อบริษัท *
        <input
          name="company"
          required
          maxLength={200}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`field ${hitBlock ? "border-[#A12828]" : ""}`}
          autoComplete="off"
          list="known-companies"
        />
      </label>
      <datalist id="known-companies">
        {companies.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {hitBlock && (
        <div role="alert" className="rounded-xl border border-[#F2C4C4] bg-[#FDE7E7] px-3 py-2.5 text-[13px] leading-relaxed text-[#7A1F1F]">
          <b>บริษัทนี้อยู่ใน Blacklist</b> (เพิ่มเมื่อ {fmtLong(hitBlock.addedOn)})
          {hitBlock.reason && <div className="whitespace-pre-line">เหตุผล: {hitBlock.reason}</div>}
        </div>
      )}
      {!hitBlock && hitKnown.length > 0 && (
        <div role="status" className="rounded-xl bg-warn-bg px-3 py-2.5 text-[13px] text-warn-ink">
          เคยส่งที่นี่แล้ว:{" "}
          {hitKnown
            .slice(0, 3)
            .map((k) => `${k.position} (${fmtLong(k.appliedOn)})`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
