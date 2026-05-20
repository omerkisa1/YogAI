import {
  FACE_EXERCISE_CONFIGS,
} from "@/lib/faceRepCounter";
import {
  FACE_HAND_EXERCISE_CONFIGS,
} from "@/lib/faceHandRepCounter";
import type { Pose, PlanType } from "@/types/yoga";
import type { Translations } from "@/lib/i18n";

export type ExerciseAnalysisKind = PlanType;

export function resolveExerciseAnalysisKind(
  poseId: string,
  catalogKind?: Pose["analysis_kind"],
): ExerciseAnalysisKind {
  if (FACE_HAND_EXERCISE_CONFIGS[poseId]) return "face_hand";
  if (FACE_EXERCISE_CONFIGS[poseId]) return "face";
  if (catalogKind === "face" || catalogKind === "face_hand") return catalogKind;
  return "body";
}

export function poseAnalysisDomain(p: Pose): PlanType {
  if (p.analysis_kind === "face" || p.analysis_kind === "face_hand") {
    return p.analysis_kind;
  }
  return "body";
}

export function domainsCompatible(a: PlanType, b: PlanType): boolean {
  return a === b;
}

export function mixDomainErrorMessage(
  existing: PlanType,
  incoming: PlanType,
  t: Translations,
): string {
  const hasBody = existing === "body" || incoming === "body";
  if (hasBody) return t.cannotMixCategories;
  return t.cannotMixFaceTypes;
}

export function domainBadgeLabel(domain: PlanType, t: Translations): string {
  if (domain === "face") return t.faceYoga;
  if (domain === "face_hand") return t.faceHandYoga;
  return t.bodyYoga;
}

export function isFacePlanType(planType: PlanType): boolean {
  return planType === "face" || planType === "face_hand";
}

export function domainBadgeClass(domain: PlanType): string {
  if (domain === "face" || domain === "face_hand") {
    return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
  }
  return "bg-sage-100 text-sage-700 dark:bg-sage-950/40 dark:text-sage-300";
}
