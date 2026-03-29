"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import api from "@/lib/axios";
import { auth as firebaseAuth, googleProvider } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updatePlatformInfo = useCallback(async (provider: "google" | "email") => {
    try {
      await api.put("/api/v1/profile", {
        platform: "web",
        auth_provider: provider,
        last_login_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Failed to update platform info:", error);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(firebaseAuth, googleProvider);
    await updatePlatformInfo("google");
  }, [updatePlatformInfo]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      await updatePlatformInfo("email");
    },
    [updatePlatformInfo]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateFirebaseProfile(userCredential.user, { displayName });
      await updatePlatformInfo("email");
    },
    [updatePlatformInfo]
  );

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      await registerWithEmail(email, password, "");
    },
    [registerWithEmail]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    signUpWithEmail,
    signOut,
  };
}
