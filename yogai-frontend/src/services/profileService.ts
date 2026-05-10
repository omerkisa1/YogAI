import api from "@/lib/axios";
import type { APIResponse, UserProfile } from "@/types/yoga";

export const profileService = {
  getProfile: async (): Promise<UserProfile | null> => {
    const res = await api.get("/api/v1/profile") as APIResponse<UserProfile | null>;
    return res.data ?? null;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<void> => {
    await api.put("/api/v1/profile", data);
  },
};
