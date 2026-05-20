import type { YogaPlan, PlanType, Pose } from "@/types/yoga";
import { normalizePlanType, resolveExerciseAnalysisKind } from "@/lib/poseDomain";

export function getLocalizedField(locale: string, en: string, tr: string): string {
  return locale === "tr" ? (tr || en) : (en || tr);
}

export function getLocalizedPlan(plan: YogaPlan, locale: string) {
  const raw = plan.plan_en || plan.plan_tr;
  if (!raw) return null;

  return {
    id: plan.id,
    title: getLocalizedField(locale, raw.title_en, raw.title_tr),
    description: getLocalizedField(locale, raw.description_en, raw.description_tr),
    focus_area: raw.focus_area,
    difficulty: raw.difficulty,
    total_duration_min: raw.total_duration_min,
    is_favorite: plan.is_favorite ?? raw.is_favorite,
    is_pinned: plan.is_pinned ?? raw.is_pinned,
    source: raw.source,
    analyzable_pose_count: raw.analyzable_pose_count,
    total_pose_count: raw.total_pose_count,
    exercises: raw.exercises.map((ex) => ({
      pose_id: ex.pose_id,
      name: getLocalizedField(locale, ex.name_en, ex.name_tr),
      instructions: getLocalizedField(locale, ex.instructions_en, ex.instructions_tr),
      benefit: getLocalizedField(locale, ex.benefit_en, ex.benefit_tr),
      duration_min: ex.duration_min,
      target_area: ex.target_area,
      category: ex.category,
      is_analyzable: ex.is_analyzable,
    })),
    created_at: plan.created_at,
  };
}

export type LocalizedPlan = NonNullable<ReturnType<typeof getLocalizedPlan>>;

export function emptyLocalizedPlan(plan: YogaPlan, yogaPlanLabel: string): LocalizedPlan {
  return {
    id: plan.id,
    title: yogaPlanLabel,
    description: "",
    focus_area: plan.focus_area ?? "",
    difficulty: plan.level ?? "",
    total_duration_min: plan.duration ?? 0,
    is_favorite: plan.is_favorite ?? false,
    is_pinned: plan.is_pinned ?? false,
    source:
      plan.source === "ai" || plan.source === "custom" ? plan.source : undefined,
    exercises: [],
    analyzable_pose_count: 0,
    total_pose_count: 0,
    created_at: plan.created_at,
  };
}

export function getLocalizedPlanSafe(plan: YogaPlan, locale: string, yogaPlanLabel: string): LocalizedPlan {
  return getLocalizedPlan(plan, locale) ?? emptyLocalizedPlan(plan, yogaPlanLabel);
}

export function inferPlanType(
  plan: YogaPlan,
  catalogKindByPoseId?: (poseId: string) => Pose["analysis_kind"] | undefined,
): PlanType {
  if (plan.plan_type) {
    return normalizePlanType(plan.plan_type);
  }
  const raw = plan.plan_en || plan.plan_tr;
  const firstPoseId = raw?.exercises?.[0]?.pose_id;
  if (firstPoseId && catalogKindByPoseId) {
    const kind = catalogKindByPoseId(firstPoseId);
    if (kind === "face" || kind === "face_hand") return "face";
  }
  if (firstPoseId) {
    const kind = resolveExerciseAnalysisKind(firstPoseId);
    if (kind === "face" || kind === "face_hand") return "face";
  }
  return "body";
}
