"use client";

import { useQuery } from "@tanstack/react-query";
import { poseService } from "@/services/poseService";

export function useAllPoses() {
  return useQuery({
    queryKey: ["all-poses"],
    queryFn: poseService.getAllPoses,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePose(id: string) {
  return useQuery({
    queryKey: ["pose", id],
    queryFn: () => poseService.getPose(id),
    enabled: !!id,
  });
}

export function useAnalyzablePoses() {
  return useQuery({
    queryKey: ["analyzable-poses"],
    queryFn: poseService.getAnalyzablePoses,
    staleTime: 10 * 60 * 1000,
  });
}
