"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/layout/AuthProvider";
import api from "@/lib/axios";
import {
  analyzePoseClientSide,
  type LandmarkRule,
  type LandmarkPoint,
  type AnalyzeResult as ClientAnalyzeResult,
} from "@/lib/poseAnalyzer";
import type {
  YogaPlan,
  BilingualPlan,
  BilingualExercise,
  GeneratePlanRequest,
  GeneratePlanResponse,
  AnalyzePoseRequest,
  AnalyzeResponse,
  APIResponse,
} from "@/types/yoga";
import type { Locale } from "@/lib/i18n";

const emptyBilingualPlan: BilingualPlan = {
  title_en: "Yoga Plan",
  title_tr: "Yoga Planı",
  focus_area: "",
  difficulty: "Beginner",
  total_duration_min: 0,
  description_en: "",
  description_tr: "",
  is_favorite: false,
  is_pinned: false,
  exercises: [],
  analyzable_pose_count: 0,
  total_pose_count: 0,
};

export interface LocalizedPlan {
  title: string;
  description: string;
  focus_area: string;
  difficulty: string;
  total_duration_min: number;
  is_favorite: boolean;
  is_pinned: boolean;
  analyzable_pose_count: number;
  total_pose_count: number;
  exercises: LocalizedExercise[];
}

export interface LocalizedExercise {
  pose_id: string;
  name: string;
  duration_min: number;
  instructions: string;
  benefit: string;
  target_area: string;
  category: string;
  is_analyzable: boolean;
}

export function getLocalizedPlan(plan: YogaPlan, locale: Locale): LocalizedPlan {
  const b = plan.plan;
  if (!b) return localizeEmpty();

  const isEN = locale === "en";
  return {
    title: isEN ? (b.title_en || b.title_tr || "Yoga Plan") : (b.title_tr || b.title_en || "Yoga Planı"),
    description: isEN ? (b.description_en || b.description_tr || "") : (b.description_tr || b.description_en || ""),
    focus_area: b.focus_area || "",
    difficulty: b.difficulty || "",
    total_duration_min: b.total_duration_min || 0,
    is_favorite: b.is_favorite || false,
    is_pinned: b.is_pinned || false,
    analyzable_pose_count: b.analyzable_pose_count || 0,
    total_pose_count: b.total_pose_count || 0,
    exercises: (b.exercises || []).map((ex) => localizeExercise(ex, locale)),
  };
}

function localizeEmpty(): LocalizedPlan {
  return {
    title: "Yoga Plan",
    description: "",
    focus_area: "",
    difficulty: "",
    total_duration_min: 0,
    is_favorite: false,
    is_pinned: false,
    analyzable_pose_count: 0,
    total_pose_count: 0,
    exercises: [],
  };
}

function localizeExercise(ex: BilingualExercise, locale: Locale): LocalizedExercise {
  const isEN = locale === "en";
  return {
    pose_id: ex.pose_id,
    name: isEN ? (ex.name_en || ex.name_tr || "") : (ex.name_tr || ex.name_en || ""),
    duration_min: ex.duration_min,
    instructions: isEN ? (ex.instructions_en || ex.instructions_tr || "") : (ex.instructions_tr || ex.instructions_en || ""),
    benefit: isEN ? (ex.benefit_en || ex.benefit_tr || "") : (ex.benefit_tr || ex.benefit_en || ""),
    target_area: ex.target_area,
    category: ex.category,
    is_analyzable: ex.is_analyzable,
  };
}

function mapRawPlan(raw: Record<string, unknown>): YogaPlan {
  const rawPlan = raw.plan as Record<string, unknown> | undefined;

  let plan: BilingualPlan;

  if (rawPlan && (rawPlan.title_en || rawPlan.title_tr)) {
    plan = { ...emptyBilingualPlan, ...rawPlan } as BilingualPlan;
  } else {
    const legacyEN = raw.plan_en as Record<string, unknown> | undefined;
    const legacyTR = raw.plan_tr as Record<string, unknown> | undefined;
    const src = legacyEN || legacyTR;
    if (src) {
      plan = convertLegacyPlan(src, legacyTR);
    } else {
      plan = emptyBilingualPlan;
    }
  }

  return {
    id: (raw.id as string) || "",
    plan,
    level: (raw.level as string) || "",
    duration: (raw.duration as number) || 0,
    focus_area: (raw.focus_area as string) || "",
    is_favorite: (raw.is_favorite as boolean) || false,
    is_pinned: (raw.is_pinned as boolean) || false,
    created_at: (raw.created_at as string) || new Date().toISOString(),
  };
}

function convertLegacyPlan(
  planEN: Record<string, unknown>,
  planTR?: Record<string, unknown>
): BilingualPlan {
  const exEN = (planEN.exercises as Array<Record<string, unknown>>) || [];
  const exTR = (planTR?.exercises as Array<Record<string, unknown>>) || [];

  const exercises: BilingualExercise[] = exEN.map((ex, i) => {
    const exTRItem = exTR[i] || {};
    return {
      pose_id: (ex.pose_id as string) || "",
      name_en: (ex.name as string) || (ex.name_en as string) || "",
      name_tr: (exTRItem.name as string) || (ex.name_tr as string) || (ex.name as string) || "",
      duration_min: (ex.duration_min as number) || 0,
      instructions_en: (ex.instructions as string) || (ex.instructions_en as string) || "",
      instructions_tr: (exTRItem.instructions as string) || (ex.instructions_tr as string) || (ex.instructions as string) || "",
      benefit_en: (ex.benefit as string) || (ex.benefit_en as string) || "",
      benefit_tr: (exTRItem.benefit as string) || (ex.benefit_tr as string) || (ex.benefit as string) || "",
      target_area: (ex.target_area as string) || "",
      category: (ex.category as string) || "",
      is_analyzable: (ex.is_analyzable as boolean) || false,
    };
  });

  return {
    title_en: (planEN.title as string) || (planEN.title_en as string) || "Yoga Plan",
    title_tr: (planTR?.title as string) || (planEN.title_tr as string) || "Yoga Planı",
    focus_area: (planEN.focus_area as string) || "",
    difficulty: (planEN.difficulty as string) || "",
    total_duration_min: (planEN.total_duration_min as number) || 0,
    description_en: (planEN.description as string) || (planEN.description_en as string) || "",
    description_tr: (planTR?.description as string) || (planEN.description_tr as string) || "",
    is_favorite: false,
    is_pinned: false,
    exercises,
    analyzable_pose_count: 0,
    total_pose_count: exercises.length,
  };
}

export function usePlans() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<YogaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    try {
      const response = (await api.get("/api/v1/yoga/plans")) as APIResponse<{
        plans: Array<Record<string, unknown>>;
      }>;
      const rawPlans = response.data?.plans || [];
      setPlans(rawPlans.map(mapRawPlan));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  return { plans: sortedPlans, loading, refetch: fetchPlans };
}

export function useGeneratePlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (data: GeneratePlanRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = (await api.post("/api/v1/yoga/plan", data)) as APIResponse<GeneratePlanResponse>;
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate plan";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generatePlan, loading, error };
}

export function useAnalyzePose() {
  const [rules, setRules] = useState<LandmarkRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetches landmark rules for a pose from the backend — called ONCE when the
   * user selects a pose, not on every frame.
   */
  const loadPoseRules = useCallback(async (poseId: string) => {
    setIsLoading(true);
    try {
      const res = (await api.get(`/api/v1/yoga/poses/${poseId}`)) as APIResponse<{
        landmark_rules?: LandmarkRule[];
      }>;
      const fetched = res.data?.landmark_rules ?? [];
      setRules(fetched);
      return fetched;
    } catch (error) {
      console.error("Failed to load pose rules:", error);
      setRules([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Runs client-side pose analysis — no network request.
   * Requires rules to have been loaded via loadPoseRules first.
   */
  const analyze = useCallback(
    (poseId: string, landmarks: LandmarkPoint[]): ClientAnalyzeResult | null => {
      if (rules.length === 0) return null;
      return analyzePoseClientSide(poseId, rules, landmarks);
    },
    [rules],
  );

  /**
   * @deprecated Use loadPoseRules + analyze (client-side) instead.
   * Kept for backward compatibility; sends a POST to the backend.
   */
  const analyzePose = async (data: AnalyzePoseRequest) => {
    try {
      const response = (await api.post("/api/v1/yoga/analyze", data)) as APIResponse<AnalyzeResponse>;
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze pose";
      console.error(message);
      throw err;
    }
  };

  return { rules, isLoading, loadPoseRules, analyze, analyzePose };
}

export function useUpdatePlan() {
  const [loading, setLoading] = useState(false);

  const updatePlan = async (planId: string, data: { is_favorite?: boolean; is_pinned?: boolean }) => {
    setLoading(true);
    try {
      const response = (await api.patch(`/api/v1/yoga/plans/${planId}`, data)) as APIResponse<Record<string, unknown>>;
      return response.data ? mapRawPlan(response.data) : null;
    } finally {
      setLoading(false);
    }
  };

  return { updatePlan, loading };
}

export function useDeletePlan() {
  const [loading, setLoading] = useState(false);

  const deletePlan = async (planId: string) => {
    setLoading(true);
    try {
      await api.delete(`/api/v1/yoga/plans/${planId}`);
    } finally {
      setLoading(false);
    }
  };

  return { deletePlan, loading };
}
