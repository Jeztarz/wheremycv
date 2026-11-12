import type { BlockedCompany, KnownApp } from "@/components/CompanyInput";
import type { DB } from "./env";
import { listApplications, listBlacklist } from "./queries";

/** ข้อมูลสำหรับเตือนในช่องชื่อบริษัท (เคยส่งแล้ว / อยู่ใน Blacklist) */
export async function companyHints(d: DB, userId: string, excludeAppId?: string): Promise<{ known: KnownApp[]; blocked: BlockedCompany[] }> {
  const [apps, bl] = await Promise.all([listApplications(d, userId), listBlacklist(d, userId)]);
  return {
    known: apps.filter((a) => a.id !== excludeAppId).map((a) => ({ company: a.company, position: a.position, appliedOn: a.appliedOn })),
    blocked: bl.map((b) => ({ company: b.company, reason: b.reason, addedOn: b.createdAt.slice(0, 10) })),
  };
}
