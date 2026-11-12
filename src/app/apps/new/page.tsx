import { createApplication } from "@/app/actions";
import { AppForm } from "@/components/AppForm";
import { BackBar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { todayBkk } from "@/lib/dates";
import { db } from "@/lib/env";
import { companyHints } from "@/lib/form-context";

export default async function NewApplication() {
  const user = await requireUser();
  const hints = await companyHints(db(), user.id);
  return (
    <>
      <BackBar href="/" />
      <h1 className="px-5 pb-4 text-[22px] font-bold">เพิ่มการสมัคร</h1>
      <AppForm action={createApplication} today={todayBkk()} cancelHref="/" {...hints} />
    </>
  );
}
