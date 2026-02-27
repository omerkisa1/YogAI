"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/layout/AuthProvider";
import api from "@/lib/axios";
import type { UserProfile, APIResponse } from "@/types/yoga";

export function useProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const response = (await api.get("/api/v1/profile")) as APIResponse<UserProfile>;
      setProfile(response.data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

export function useSaveProfile() {
  const [loading, setLoading] = useState(false);

  const saveProfile = async (data: Omit<UserProfile, "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const response = (await api.put("/api/v1/profile", data)) as APIResponse<UserProfile>;
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { saveProfile, loading };
}
