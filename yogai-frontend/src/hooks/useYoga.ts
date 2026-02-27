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

export function usePlans() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<YogaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFromAPI = useCallback(async () => {
    try {
      const response = (await api.get("/api/v1/yoga/plans")) as APIResponse<{
        plans: Array<{
          id: string;
          plan: unknown;
          level: string;
          duration: number;
          focus_area: string;
          created_at: string;
        }>;
      }>;
      const rawPlans = response.data?.plans || [];
      const mapped: YogaPlan[] = rawPlans.map((p) => ({
        id: p.id,
        plan: safeParsePlan(p.plan),
        level: p.level || "",
        duration: p.duration || 0,
        focus_area: p.focus_area || "",
        created_at: p.created_at || new Date().toISOString(),
      }));
      setPlans(mapped);
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

  return { plans, loading };
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
