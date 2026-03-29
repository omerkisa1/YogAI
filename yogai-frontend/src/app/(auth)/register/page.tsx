"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthContext } from "@/components/layout/AuthProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail, signInWithGoogle } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const getFirebaseErrorMessage = (error: unknown) => {
    if (!(error instanceof FirebaseError)) {
      return "Kayıt işlemi başarısız oldu";
    }

    switch (error.code) {
      case "auth/email-already-in-use":
        return "Bu email zaten kullanılıyor";
      case "auth/weak-password":
        return "Şifre en az 6 karakter olmalıdır";
      case "auth/invalid-email":
        return "Geçersiz email adresi";
      case "auth/network-request-failed":
        return "İnternet bağlantınızı kontrol edin";
      default:
        return "Kayıt işlemi başarısız oldu";
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      await registerWithEmail(data.email.trim(), data.password, data.displayName.trim());
      toast.success("Hesabınız oluşturuldu");
      router.push("/onboarding");
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  });

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/onboarding");
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-th-bg px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-th-border bg-th-card p-6 shadow-sm"
      >
        <div className="mb-6">
          <p className="text-sm text-th-text-mut">🧘 YogAI</p>
          <h1 className="mt-1 text-2xl font-bold text-th-text">Hesap Oluştur</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-th-text">Ad Soyad</label>
            <input
              type="text"
              {...register("displayName", {
                required: "Ad Soyad zorunludur",
                minLength: { value: 2, message: "Ad Soyad en az 2 karakter olmalı" },
              })}
              className="input-field"
              placeholder="Ad Soyad"
              disabled={loading}
            />
            {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-th-text">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email zorunludur",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Geçersiz email adresi",
                },
              })}
              className="input-field"
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-th-text">Şifre</label>
            <input
              type="password"
              {...register("password", {
                required: "Şifre zorunludur",
                minLength: { value: 6, message: "Şifre en az 6 karakter olmalıdır" },
              })}
              className="input-field"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-th-text">Şifre Tekrar</label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Şifre tekrarı zorunludur",
                validate: (value) => value === password || "Şifreler eşleşmiyor",
              })}
              className="input-field"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <LoadingSpinner size="sm" /> : "Kayıt Ol"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-th-border" />
          <span className="text-xs text-th-text-mut">veya</span>
          <div className="h-px flex-1 bg-th-border" />
        </div>

        <button
          onClick={handleGoogleRegister}
          type="button"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-th-border bg-th-card px-4 py-3 text-sm font-medium text-th-text transition-all hover:bg-th-subtle hover:shadow-sm disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google ile Kayıt Ol
        </button>

        <p className="mt-6 text-center text-sm text-th-text-mut">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-medium text-sage-500 hover:text-sage-600">
            Giriş Yap
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
