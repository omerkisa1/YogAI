import api from "@/lib/axios";
import type {
  APIResponse,
  TrainingSession,
  TrainingSessionStart,
  TrainingStats,
} from "@/types/yoga";

export const trainingService = {
  startSession: async (planId: string): Promise<TrainingSessionStart> => {
    const res = await api.post("/api/v1/training/start", { plan_id: planId }) as APIResponse<TrainingSessionStart>;
    if (!res.data) throw new Error("No session data");
    return res.data;
  },

  submitPose: async (
    sessionId: string,
    data: { pose_id: string; accuracy: number; duration_seconds: number },
  ): Promise<void> => {
    await api.post(`/api/v1/training/sessions/${sessionId}/pose`, data);
  },

  completeSession: async (sessionId: string): Promise<void> => {
    await api.post(`/api/v1/training/sessions/${sessionId}/complete`);
  },

  getSessions: async (): Promise<TrainingSession[]> => {
    const res = await api.get("/api/v1/training/sessions") as APIResponse<TrainingSession[]>;
    return res.data ?? [];
  },

  getSession: async (id: string): Promise<TrainingSession> => {
    const res = await api.get(`/api/v1/training/sessions/${id}`) as APIResponse<TrainingSession>;
    if (!res.data) throw new Error("Session not found");
    return res.data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/training/sessions/${id}`);
  },

  getStats: async (): Promise<TrainingStats> => {
    const res = await api.get("/api/v1/training/stats") as APIResponse<TrainingStats>;
    return (
      res.data ?? {
        total_sessions: 0,
        total_duration_sec: 0,
        average_accuracy: 0,
        current_streak: 0,
      }
    );
  },
};
