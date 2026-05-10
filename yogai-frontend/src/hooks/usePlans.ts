"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { planService } from "@/services/planService";
import type { GeneratePlanRequest, CustomPlanRequest } from "@/types/yoga";

export function usePlans() {
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: planService.getPlans,
  });

  const plans = useMemo(() => {
    const list = query.data ?? [];
    return [...list].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [query.data]);

  return {
    ...query,
    plans,
    loading: query.isLoading,
  };
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ["plan", id],
    queryFn: () => planService.getPlan(id),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GeneratePlanRequest) => planService.createPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useCreateCustomPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomPlanRequest) => planService.createCustomPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { is_favorite?: boolean; is_pinned?: boolean };
    }) => planService.updatePlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planService.deletePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}
