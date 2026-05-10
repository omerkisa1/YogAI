import api from "@/lib/axios";
import type { APIResponse, Pose } from "@/types/yoga";

export const poseService = {
  getAllPoses: async (): Promise<Pose[]> => {
    const res = await api.get("/api/v1/yoga/poses") as APIResponse<Pose[]>;
    return Array.isArray(res.data) ? res.data : [];
  },

  getPose: async (id: string): Promise<Pose> => {
    const res = await api.get(`/api/v1/yoga/poses/${id}`) as APIResponse<Pose>;
    if (!res.data) throw new Error("Pose not found");
    return res.data;
  },

  getAnalyzablePoses: async (): Promise<Pose[]> => {
    const res = await api.get("/api/v1/yoga/poses/analyzable") as APIResponse<Pose[]>;
    return Array.isArray(res.data) ? res.data : [];
  },
};
