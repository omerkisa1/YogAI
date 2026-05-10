import api from "@/lib/axios";
import type {
  APIResponse,
  YogaPlan,
  BilingualPlan,
  GeneratePlanRequest,
  CustomPlanRequest,
  CustomPlanResponse,
} from "@/types/yoga";

type PlansListData = { plans: YogaPlan[]; count?: number };

type CreatedPlanData = {
  id: string;
  plan: BilingualPlan;
  level: string;
  duration: number;
  focus_area: string;
  source?: string;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
};

function normalizeCreatedPlan(d: CreatedPlanData): YogaPlan {
  return {
    id: d.id,
    plan_en: d.plan,
    plan_tr: d.plan,
    created_at: d.created_at,
    level: d.level,
    duration: d.duration,
    focus_area: d.focus_area,
    source: d.source as "ai" | "custom" | undefined,
    is_favorite: d.is_favorite,
    is_pinned: d.is_pinned,
  };
}

export const planService = {
  getPlans: async (): Promise<YogaPlan[]> => {
    const res = await api.get("/api/v1/yoga/plans") as APIResponse<PlansListData>;
    return res.data?.plans ?? [];
  },

  getPlan: async (id: string): Promise<YogaPlan> => {
    const res = await api.get(`/api/v1/yoga/plans/${id}`) as APIResponse<YogaPlan>;
    if (!res.data) throw new Error("Plan not found");
    return res.data;
  },

  createPlan: async (data: GeneratePlanRequest): Promise<YogaPlan> => {
    const res = await api.post("/api/v1/yoga/plan", data) as APIResponse<CreatedPlanData>;
    if (!res.data) throw new Error("No plan data");
    return normalizeCreatedPlan(res.data);
  },

  createCustomPlan: async (data: CustomPlanRequest): Promise<CustomPlanResponse> => {
    const res = await api.post("/api/v1/yoga/plans/custom", data) as APIResponse<{
      plan: CreatedPlanData;
      warnings?: string[];
    }>;
    if (!res.data?.plan) throw new Error("No plan data");
    return {
      plan: normalizeCreatedPlan(res.data.plan),
      warnings: res.data.warnings,
    };
  },

  updatePlan: async (
    id: string,
    data: { is_favorite?: boolean; is_pinned?: boolean },
  ): Promise<void> => {
    await api.patch(`/api/v1/yoga/plans/${id}`, data);
  },

  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/yoga/plans/${id}`);
  },
};
