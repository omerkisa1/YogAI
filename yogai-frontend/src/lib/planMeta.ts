import type { YogaPlan } from "@/types/yoga";

export function getEffectivePlanSource(
  plan: YogaPlan,
): "ai" | "custom" | undefined {
  const r = plan.source;
  if (r === "ai" || r === "custom") return r;
  const b = plan.plan_en?.source ?? plan.plan_tr?.source;
  if (b === "ai" || b === "custom") return b;
  return undefined;
}
