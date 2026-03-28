"use client";

import axios from "axios";
import { auth } from "@/lib/firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  await auth.authStateReady(); 
  
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("DİKKAT: Kullanıcı girişi bulunamadı, yetkisiz istek atılıyor!");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
