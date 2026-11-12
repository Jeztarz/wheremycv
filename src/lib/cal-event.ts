import type { AppEvent, Application } from "@/db/schema";
import type { CalEvent } from "./calendar-links";

export function calEventFor(e: AppEvent, app: Application): CalEvent {
  const what = e.type === "interview" ? `สัมภาษณ์${e.round ? `รอบ ${e.round}` : ""}` : e.type === "assignment" ? "ส่ง Assignment" : "นัด";
  const mode = e.mode === "online" ? "Online" : e.mode === "onsite" ? "Onsite" : null;
  return {
    id: e.id,
    title: `${what} · ${app.company}`,
    date: e.occurredOn,
    time: e.atTime,
    durationMin: 60,
    location: e.location,
    details: [`${app.position} @ ${app.company}`, mode, e.note].filter(Boolean).join("\n"),
  };
}
