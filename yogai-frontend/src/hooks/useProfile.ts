"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { profileService } from "@/services/profileService";
import type { UserProfile } from "@/types/yoga";

export function useProfile() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => profileService.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
