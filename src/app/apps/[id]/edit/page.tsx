import { notFound } from "next/navigation";
import { deleteApplication, updateApplication } from "@/app/actions";
import { AppForm } from "@/components/AppForm";
import { ConfirmButton } from "@/components/SubmitButton";
import { BackBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { companyHints } from "@/lib/form-context";
import { getApplication } from "@/lib/queries";

export default async function EditApplication({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const d = db();
  const [found, hints] = await Promise.all([getApplication(d, user.id, id), companyHints(d, user.id, id)]);
  if (!found) notFound();
  return (
    <>
      <BackBar href={`/apps/${id}`} />
      <h1 className="px-5 pb-4 text-[22px] font-bold">แก้ไขข้อมูล</h1>
      <AppForm action={updateApplication.bind(null, id)} initial={found.app} today={todayBkk()} cancelHref={`/apps/${id}`} {...hints} />
      <form action={deleteApplication.bind(null, id)} className="px-5 pb-12">
        <ConfirmButton message={`ลบ ${found.app.company} และ timeline ทั้งหมด?`} className="h-11 w-full rounded-xl text-sm font-semibold text-[#A12828]">
          ลบรายการนี้
        </ConfirmButton>
      </form>
    </>
  );
}
