import type { AnalyzeResult } from "@/lib/poseAnalyzer";

/** Text color class for accuracy percentage (pose test overlay). */
export function accuracyTextClass(acc: number): string {
  if (acc >= 80) return "text-green-400";
  if (acc >= 50) return "text-amber-400";
  return "text-red-400";
}

/** Gradient accent behind the main accuracy readout (pose test overlay). */
export function accuracyAccent(acc: number): string {
  if (acc >= 80) return "from-green-500/35 to-green-600/20";
  if (acc >= 50) return "from-amber-500/35 to-amber-600/20";
  return "from-red-500/35 to-red-600/20";
}

/** Single rule row styling in the collapsible breakdown (pose test overlay). */
export function ruleOverlayClass(r: AnalyzeResult["rules"][0]): string {
  const base =
    "rounded-xl border p-3 text-sm transition-colors border-white/15 text-white";
  if (r.status === "low_visibility")
    return `${base} border-l-4 border-l-gray-400 bg-black/45 text-white/75`;
  if (r.rule_type === "fault")
    return r.triggered
      ? `${base} border-l-4 border-l-red-500 bg-red-500/25`
      : `${base} border-l-4 border-l-white/25 bg-black/35`;
  if (r.score >= 90)
    return `${base} border-l-4 border-l-green-400 bg-black/35`;
  if (r.score >= 60)
    return `${base} border-l-4 border-l-amber-400 bg-black/35`;
  return `${base} border-l-4 border-l-red-400 bg-black/35`;
}
