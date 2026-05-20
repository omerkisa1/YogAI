"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trainingService } from "@/services/trainingService";

export function useTrainingSessions() {
  return useQuery({
    queryKey: ["training-sessions"],
    queryFn: trainingService.getSessions,
  });
}

export function useTrainingSession(id: string) {
  return useQuery({
    queryKey: ["training-session", id],
    queryFn: () => trainingService.getSession(id),
    enabled: !!id,
  });
}

export function useTrainingStats() {
  return useQuery({
    queryKey: ["training-stats"],
    queryFn: trainingService.getStats,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => trainingService.startSession(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["training-stats"] });
    },
  });
}

export function useSubmitPose() {
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: { pose_id: string; accuracy: number; duration_seconds: number };
    }) => trainingService.submitPose(sessionId, data),
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => trainingService.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["training-stats"] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["training-stats"] });
    },
  });
}
