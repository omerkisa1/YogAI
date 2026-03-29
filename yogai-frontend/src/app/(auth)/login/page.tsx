"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { motion } from "framer-motion";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useApp } from "@/components/layout/AppProvider";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuthContext();
  const { locale, setLocale, theme, toggleTheme, t } = useApp();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>();

  const getFirebaseErrorMessage = (error: unknown) => {
    if (!(error instanceof FirebaseError)) {
      return "Giriş işlemi başarısız oldu";
    }

    switch (error.code) {
      case "auth/user-not-found":
        return "Bu email ile kayıtlı kullanıcı bulunamadı";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Şifre hatalı";
      case "auth/invalid-email":
        return "Geçersiz email adresi";
      case "auth/too-many-requests":
        return "Çok fazla deneme yapıldı, lütfen bekleyin";
      case "auth/network-request-failed":
        return "İnternet bağlantınızı kontrol edin";
      default:
        return "Giriş işlemi başarısız oldu";
    }
  };

  const checkProfileAndRedirect = async () => {
    try {
      const response = await (await import("@/lib/axios")).default.get("/api/v1/profile");
      const data = (response as { data?: unknown }).data;
      router.push(data ? "/dashboard" : "/onboarding");
    } catch {
      router.push("/onboarding");
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      await checkProfileAndRedirect();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      await checkProfileAndRedirect();
    } catch {
      toast.error(t.googleFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = watch("email")?.trim();
    if (!email) {
      toast.error("Şifre sıfırlama için email girin");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Şifre sıfırlama linki gönderildi");
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-th-bg">
      <div className="hidden w-1/2 lg:flex lg:items-center lg:justify-center lg:bg-sage-400/5 dark:lg:bg-sage-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md px-12"
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-400 text-white">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-th-text">{t.heroTitle}</h1>
          <p className="mt-4 text-base text-th-text-sec leading-relaxed">{t.heroDesc}</p>
          <div className="mt-8 space-y-4">
            {[t.feature1, t.feature2, t.feature3].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-400/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#889E81" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm text-th-text-sec">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "tr" : "en")}
              className="flex h-8 items-center justify-center rounded-lg bg-th-subtle px-2.5 text-xs font-semibold text-th-text-sec transition-colors hover:bg-th-muted"
            >
              {locale === "en" ? "TR" : "EN"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-subtle text-th-text-sec transition-colors hover:bg-th-muted"
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>

          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sage-400 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-th-text">{t.welcomeBack}</h2>
          <p className="mt-2 text-sm text-th-text-mut">
            {t.loginSubtitle}
          </p>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-th-border bg-th-card px-4 py-3 text-sm font-medium text-th-text transition-all hover:bg-th-subtle hover:shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.continueGoogle}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-th-border" />
            <span className="text-xs text-th-text-mut">{t.or}</span>
            <div className="h-px flex-1 bg-th-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-th-text">
                {t.email}
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email zorunludur",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Geçersiz email adresi",
                  },
                })}
                placeholder="you@example.com"
                className="input-field"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-th-text">
                {t.password}
              </label>
              <input
                type="password"
                {...register("password", { required: true, minLength: 6 })}
                placeholder="••••••••"
                className="input-field"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">Min 6</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : t.signIn}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="mt-3 text-sm font-medium text-sage-500 hover:text-sage-600 disabled:opacity-50"
          >
            Şifremi unuttum
          </button>

          <p className="mt-6 text-center text-sm text-th-text-mut">
            Hesabın yok mu?{" "}
            <Link
              href="/register"
              className="font-medium text-sage-500 hover:text-sage-600 dark:text-sage-400 dark:hover:text-sage-300"
            >
              Kayıt ol
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
