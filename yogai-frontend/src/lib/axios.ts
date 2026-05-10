"use client";

import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { auth } from "@/lib/firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use(async (config) => {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error: {
    response?: { status?: number; data?: { message?: string; error?: string } };
    config?: RetryConfig;
    message?: string;
  }) => {
    const status = error.response?.status;

    if (status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        error.config.headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await api.request(error.config);
        return retryResponse;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Bir hata oluştu";

    const apiErr = new Error(message) as Error & {
      status?: number;
      apiDetails?: Record<string, unknown>;
    };
    apiErr.status = status;
    if (error.response?.data && typeof error.response.data === "object") {
      apiErr.apiDetails = error.response.data as Record<string, unknown>;
    }

    return Promise.reject(apiErr);
  },
);

export default api;
