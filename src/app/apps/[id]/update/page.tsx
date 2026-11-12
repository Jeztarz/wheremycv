import { notFound } from "next/navigation";
import { addEvent } from "@/app/actions";
import { BackBar } from "@/components/ui";
import { UpdateForm } from "@/components/UpdateForm";
import { requireUser } from "@/lib/auth";
import { todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { getApplication } from "@/lib/queries";
import { nextRound } from "@/lib/status";

export default async function UpdateApplication({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const found = await getApplication(db(), user.id, id);
  if (!found) notFound();
  return (
    <>
      <BackBar href={`/apps/${id}`} />
      <div className="flex flex-col gap-0.5 px-5 pb-4">
        <h1 className="text-[22px] font-bold">อัปเดตความคืบหน้า</h1>
        <div className="text-[13px] text-muted">
          {found.app.company} · {found.app.position}
        </div>
      </div>
      <UpdateForm action={addEvent.bind(null, id)} today={todayBkk()} nextRound={nextRound(found.events)} cancelHref={`/apps/${id}`} />
    </>
  );
}
