import { eq } from "drizzle-orm";
import { applications, events } from "@/db/schema";
import { icsFile } from "@/lib/calendar-links";
import { calEventFor } from "@/lib/cal-event";
import { db, env } from "@/lib/env";
import { verifyIcs } from "@/lib/ics-sign";

/** ไฟล์ .ics ของนัด 1 นัด — ต้องมีลายเซ็น (?sig=) ที่ออกให้จากหน้ารายละเอียด */
export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const sig = new URL(req.url).searchParams.get("sig");
  if (!(await verifyIcs(eventId, sig, env().AUTH_SECRET))) return new Response("Not found", { status: 404 });

  const rows = await db()
    .select()
    .from(events)
    .innerJoin(applications, eq(events.applicationId, applications.id))
    .where(eq(events.id, eventId))
    .limit(1);
  const row = rows[0];
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(icsFile(calEventFor(row.events, row.applications)), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="wheremycv-${eventId.slice(0, 8)}.ics"`,
      "cache-control": "private, no-store",
    },
  });
}
