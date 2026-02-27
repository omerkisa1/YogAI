"use client";

import { useState, useEffect } from "react";
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
  APIResponse,
} from "@/types/yoga";

export function usePlans() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<YogaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const plansRef = collection(db, "users", user.uid, "plans");
    const q = query(plansRef, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedPlans: YogaPlan[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          let parsedPlan = data.plan;
          if (typeof parsedPlan === "string") {
            try {
              parsedPlan = JSON.parse(parsedPlan);
            } catch {
              parsedPlan = { title: "Yoga Plan", description: parsedPlan, total_duration: 0, poses: [] };
            }
          }
          return {
            id: doc.id,
            plan: parsedPlan,
            level: data.level || "",
            duration: data.duration || 0,
            focus_area: data.focus_area || "",
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as YogaPlan;
        });
        setPlans(updatedPlans);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

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
