import { createApplication } from "@/app/actions";
import { AppForm } from "@/components/AppForm";
import { BackBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { listApplications } from "@/lib/queries";

export default async function NewApplication() {
  const user = await requireUser();
  const apps = await listApplications(db(), user.id);
  const companies = [...new Set(apps.map((a) => a.company))];
  return (
    <>
      <BackBar href="/" />
      <h1 className="px-5 pb-4 text-[22px] font-bold">เพิ่มการสมัคร</h1>
      <AppForm action={createApplication} today={todayBkk()} cancelHref="/" duplicates={companies} />
      {companies.length > 0 && <p className="px-5 pb-8 text-xs text-muted">พิมพ์ชื่อบริษัทแล้วจะมีชื่อที่เคยส่งไปแล้วขึ้นมาให้เลือก</p>}
    </>
  );
}
