"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/layout/AuthProvider";
import api from "@/lib/axios";
import type {
  YogaPlan,
  GeneratePlanRequest,
  GeneratePlanResponse,
  AnalyzePoseRequest,
  PoseAnalysis,
  PlanDetail,
  APIResponse,
} from "@/types/yoga";
import type { Locale } from "@/lib/i18n";

const emptyPlan: PlanDetail = {
  title: "Yoga Plan",
  focus_area: "",
  difficulty: "Beginner",
  total_duration_min: 0,
  is_favorite: false,
  is_pinned: false,
  description: "",
  exercises: [],
};

function safeParsePlan(raw: unknown): PlanDetail {
  if (typeof raw === "object" && raw !== null) return { ...emptyPlan, ...(raw as Record<string, unknown>) } as PlanDetail;
  if (typeof raw === "string") {
    try {
      return { ...emptyPlan, ...JSON.parse(raw) } as PlanDetail;
    } catch {
      return emptyPlan;
    }
  }
  return emptyPlan;
}

function mapRawPlan(raw: Record<string, unknown>): YogaPlan {
  let planEN = safeParsePlan(raw.plan_en);
  const planTR = safeParsePlan(raw.plan_tr);

  if (planEN.title === emptyPlan.title && raw.plan) {
    planEN = safeParsePlan(raw.plan);
  }

  return {
    id: (raw.id as string) || "",
    plan_en: planEN,
    plan_tr: planTR,
    level: (raw.level as string) || "",
    duration: (raw.duration as number) || 0,
    focus_area: (raw.focus_area as string) || "",
    is_favorite: (raw.is_favorite as boolean) || false,
    is_pinned: (raw.is_pinned as boolean) || false,
    created_at: (raw.created_at as string) || new Date().toISOString(),
  };
}

export function getLocalizedPlan(plan: YogaPlan, locale: Locale): PlanDetail {
  if (locale === "tr" && plan.plan_tr && plan.plan_tr.title !== emptyPlan.title) {
    return plan.plan_tr;
  }
  if (plan.plan_en && plan.plan_en.title !== emptyPlan.title) {
    return plan.plan_en;
  }
  return plan.plan_tr && plan.plan_tr.title !== emptyPlan.title ? plan.plan_tr : emptyPlan;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePose = async (data: AnalyzePoseRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = (await api.post("/api/v1/yoga/analyze", data)) as APIResponse<{ analysis: PoseAnalysis }>;
      return response.data?.analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze pose";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyzePose, loading, error };
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
