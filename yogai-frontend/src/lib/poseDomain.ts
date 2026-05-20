import {
  FACE_EXERCISE_CONFIGS,
} from "@/lib/faceRepCounter";
import {
  FACE_HAND_EXERCISE_CONFIGS,
} from "@/lib/faceHandRepCounter";
import type { Pose } from "@/types/yoga";
import type { Translations } from "@/lib/i18n";

/** Plan-level domain: body vs combined face yoga (face + face_hand poses). */
export type PlanDomain = "body" | "face";

/** Per-pose analysis pipeline kind (training / pose-test). */
export type ExerciseAnalysisKind = "body" | "face" | "face_hand";

export type PlanType = PlanDomain;

export function resolveExerciseAnalysisKind(
  poseId: string,
  catalogKind?: Pose["analysis_kind"],
): ExerciseAnalysisKind {
  if (FACE_HAND_EXERCISE_CONFIGS[poseId]) return "face_hand";
  if (FACE_EXERCISE_CONFIGS[poseId]) return "face";
  if (catalogKind === "face" || catalogKind === "face_hand") return catalogKind;
  return "body";
}

export function posePlanDomain(p: Pose): PlanDomain {
  if (p.analysis_kind === "face" || p.analysis_kind === "face_hand") {
    return "face";
  }
  return "body";
}

export function domainsCompatible(a: PlanDomain, b: PlanDomain): boolean {
  return a === b;
}

export function mixDomainErrorMessage(_existing: PlanDomain, _incoming: PlanDomain, t: Translations): string {
  return t.cannotMixCategories;
}

export function domainBadgeLabel(domain: PlanDomain, t: Translations): string {
  if (domain === "face") return t.faceYoga;
  return t.bodyYoga;
}

export function isFacePlanType(planType: string): boolean {
  return (
    planType === "face" ||
    planType === "face_hand" ||
    planType === "face_yoga" ||
    planType === "mixed"
  );
}

export function normalizePlanType(planType?: string): PlanDomain {
  if (
    planType === "face" ||
    planType === "face_hand" ||
    planType === "face_yoga" ||
    planType === "mixed"
  ) {
    return "face";
  }
  return "body";
}

export function domainBadgeClass(domain: PlanDomain): string {
  if (domain === "face") {
    return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
  }
  return "bg-sage-100 text-sage-700 dark:bg-sage-950/40 dark:text-sage-300";
}
