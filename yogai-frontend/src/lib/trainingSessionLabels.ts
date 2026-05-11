import type { Translations } from "@/lib/i18n";

export function trainingSessionStatusLabel(status: string, t: Translations): string {
  const s = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "completed") return t.sessionStatusCompleted;
  if (s === "in_progress" || s === "inprogress") return t.sessionStatusInProgress;
  if (s === "cancelled" || s === "canceled") return t.sessionStatusCancelled;
  if (s === "abandoned") return t.sessionStatusAbandoned;
  return t.sessionStatusOther;
}
