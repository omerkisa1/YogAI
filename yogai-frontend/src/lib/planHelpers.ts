import type { YogaPlan, PlanType, Pose, BilingualPlan, BilingualExercise } from "@/types/yoga";
import { normalizePlanType, resolveExerciseAnalysisKind } from "@/lib/poseDomain";

export function getLocalizedField(locale: string, en: string, tr: string): string {
  return locale === "tr" ? (tr || en) : (en || tr);
}

function unwrapBilingualPlan(raw: unknown): BilingualPlan | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as BilingualPlan & { plan?: BilingualPlan };
  if (Array.isArray(obj.exercises)) {
    return obj;
  }
  if (obj.plan && Array.isArray(obj.plan.exercises)) {
    return obj.plan;
  }
  return null;
}

export function resolveBilingualPlanContent(plan: YogaPlan): BilingualPlan | null {
  return unwrapBilingualPlan(plan.plan_en) ?? unwrapBilingualPlan(plan.plan_tr);
}

export function getLocalizedPlan(plan: YogaPlan, locale: string) {
  const raw = resolveBilingualPlanContent(plan);
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
    exercises: (raw.exercises ?? []).map((ex) => mapLocalizedExercise(ex, locale)),
    created_at: plan.created_at,
  };
}

function mapLocalizedExercise(ex: BilingualExercise, locale: string) {
  const kind =
    ex.analysis_kind ?? resolveExerciseAnalysisKind(ex.pose_id);
  const metric = ex.metric_type ?? (kind === "face" || kind === "face_hand" ? "reps" : "accuracy");
  return {
    pose_id: ex.pose_id,
    name: getLocalizedField(locale, ex.name_en, ex.name_tr),
    instructions: getLocalizedField(locale, ex.instructions_en, ex.instructions_tr),
    benefit: getLocalizedField(locale, ex.benefit_en, ex.benefit_tr),
    duration_min: ex.duration_min,
    target_area: ex.target_area,
    category: ex.category,
    is_analyzable: ex.is_analyzable,
    analysis_kind: kind,
    metric_type: metric,
    rep_target: ex.rep_target ?? 0,
  };
}

export type LocalizedPlan = NonNullable<ReturnType<typeof getLocalizedPlan>>;
export type LocalizedExercise = LocalizedPlan["exercises"][number];

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
  const raw = resolveBilingualPlanContent(plan);
  const firstPoseId = raw?.exercises?.[0]?.pose_id;
  if (firstPoseId && catalogKindByPoseId) {
    const kind = catalogKindByPoseId(firstPoseId);
    if (kind === "face" || kind === "face_hand") return "face";
  }
  if (firstPoseId) {
    const kind = resolveExerciseAnalysisKind(firstPoseId, raw?.exercises?.[0]?.analysis_kind);
    if (kind === "face" || kind === "face_hand") return "face";
  }
  return "body";
}

/** Per-pose countdown seconds for body (duration) exercises only; not used for face rep workouts. */
export function exerciseAllocatedSeconds(
  ex: Pick<LocalizedExercise, "duration_min" | "metric_type" | "rep_target">,
  devShortTimer: boolean,
): number {
  if (devShortTimer) return 15;
  if (ex.metric_type === "reps") {
    const reps = ex.rep_target > 0 ? ex.rep_target : 10;
    const seconds = reps * 3 + 10;
    return Math.max(30, seconds);
  }
  if (ex.duration_min > 0) {
    return Math.max(1, Math.round(ex.duration_min * 60));
  }
  return 60;
}
