"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  return {
    id: (raw.id as string) || "",
    plan: safeParsePlan(raw.plan),
    level: (raw.level as string) || "",
    duration: (raw.duration as number) || 0,
    focus_area: (raw.focus_area as string) || "",
    is_favorite: (raw.is_favorite as boolean) || false,
    is_pinned: (raw.is_pinned as boolean) || false,
    created_at: (raw.created_at as string) || new Date().toISOString(),
  };
}

export function usePlans() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<YogaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFromAPI = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    let firestoreFailed = false;

    const plansRef = collection(db, "users", user.uid, "plans");
    const q = query(plansRef, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedPlans: YogaPlan[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            plan: safeParsePlan(data.plan),
            level: data.level || "",
            duration: data.duration || 0,
            focus_area: data.focus_area || "",
            is_favorite: data.is_favorite || false,
            is_pinned: data.is_pinned || false,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });
        setPlans(updatedPlans);
        setLoading(false);
      },
      () => {
        firestoreFailed = true;
        fetchFromAPI();
      }
    );

    const timeout = setTimeout(() => {
      if (loading && !firestoreFailed) {
        fetchFromAPI();
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user, fetchFromAPI, loading]);

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  return { plans: sortedPlans, loading, refetch: fetchFromAPI };
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
