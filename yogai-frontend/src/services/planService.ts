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
  const content =
    d.plan && Array.isArray(d.plan.exercises)
      ? d.plan
      : unwrapPlanPayload(d as unknown as Record<string, unknown>) ?? d.plan;

  return {
    id: d.id,
    plan_en: content,
    plan_tr: content,
    created_at: d.created_at,
    level: d.level,
    duration: d.duration,
    focus_area: d.focus_area,
    source: d.source as "ai" | "custom" | undefined,
    is_favorite: d.is_favorite,
    is_pinned: d.is_pinned,
  };
}

function unwrapPlanPayload(raw: unknown): BilingualPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as BilingualPlan & { plan?: BilingualPlan };
  if (Array.isArray(obj.exercises)) return obj;
  if (obj.plan && Array.isArray(obj.plan.exercises)) return obj.plan;
  return null;
}

function normalizePlanFromApi(data: Record<string, unknown>): YogaPlan {
  const planEn = unwrapPlanPayload(data.plan_en) ?? unwrapPlanPayload(data);
  const planTr = unwrapPlanPayload(data.plan_tr) ?? planEn;
  return {
    id: String(data.id ?? ""),
    plan_en: planEn ?? ({} as BilingualPlan),
    plan_tr: planTr ?? planEn ?? ({} as BilingualPlan),
    created_at: String(data.created_at ?? ""),
    level: data.level as string | undefined,
    duration: data.duration as number | undefined,
    focus_area: data.focus_area as string | undefined,
    plan_type: data.plan_type as YogaPlan["plan_type"],
    source: data.source as YogaPlan["source"],
    is_favorite: data.is_favorite as boolean | undefined,
    is_pinned: data.is_pinned as boolean | undefined,
  };
}

export const planService = {
  getPlans: async (): Promise<YogaPlan[]> => {
    const res = await api.get("/api/v1/yoga/plans") as APIResponse<PlansListData>;
    const plans = res.data?.plans ?? [];
    return plans.map((p) =>
      normalizePlanFromApi(p as unknown as Record<string, unknown>),
    );
  },

  getPlan: async (id: string): Promise<YogaPlan> => {
    const res = await api.get(`/api/v1/yoga/plans/${id}`) as APIResponse<Record<string, unknown>>;
    if (!res.data) throw new Error("Plan not found");
    return normalizePlanFromApi(res.data);
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
