"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlans";
import { useSubmitPose, useCompleteSession } from "@/hooks/useTraining";
import { useApp } from "@/components/layout/AppProvider";
import { getLocalizedPlanSafe } from "@/lib/planHelpers";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { X, PersonStanding } from "lucide-react";

const FIXED_ACCURACY = 75;
const DEV_TIMER = process.env.NODE_ENV === "development";

function poseSeconds(durationMin: number): number {
  if (DEV_TIMER) return 15;
  return Math.max(1, Math.round(durationMin * 60));
}

export default function TrainingSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const { t, locale } = useApp();

  const { data: plan, isLoading: planLoading } = usePlan(planId);
  const submitPose = useSubmitPose();
  const completeSession = useCompleteSession();

  const detail = useMemo(
    () => (plan ? getLocalizedPlanSafe(plan, locale, t.yogaPlan) : null),
    [plan, locale, t.yogaPlan],
  );

  const exercises = detail?.exercises ?? [];
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const autoKeyRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = exercises[index];
  const next = exercises[index + 1];
  const allocated = current ? poseSeconds(current.duration_min) : 0;

  const finishWorkout = useCallback(async () => {
    try {
      await completeSession.mutateAsync(sessionId);
      setPhase("done");
    } catch {
      router.push("/training");
    }
  }, [completeSession, sessionId, router]);

  const goNextOrFinish = useCallback(
    async (accuracy: number, durationSeconds: number) => {
      if (!current) return;
      try {
        await submitPose.mutateAsync({
          sessionId,
          data: {
            pose_id: current.pose_id,
            accuracy,
            duration_seconds: durationSeconds,
          },
        });
        setScores((s) => [...s, accuracy]);
        const last = index >= exercises.length - 1;
        if (last) {
          await finishWorkout();
        } else {
          autoKeyRef.current = null;
          setIndex((i) => i + 1);
        }
      } catch {
        router.push("/training");
      }
    },
    [current, sessionId, submitPose, index, exercises.length, router, finishWorkout],
  );

  useEffect(() => {
    if (!planId || !sessionId) {
      router.replace("/dashboard");
    }
  }, [planId, sessionId, router]);

  useEffect(() => {
    if (phase !== "run" || !current) return;
    const sec = poseSeconds(current.duration_min);
    setTimer(sec);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, index, current?.pose_id, current?.duration_min]);

  useEffect(() => {
    if (phase !== "run" || !current || timer > 0) return;
    const key = `${sessionId}-${current.pose_id}-${index}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    void goNextOrFinish(FIXED_ACCURACY, allocated);
  }, [timer, phase, current, index, sessionId, allocated, goNextOrFinish]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  const onComplete = () => {
    if (!current) return;
    const elapsed = Math.max(1, allocated - timer);
    if (intervalRef.current) clearInterval(intervalRef.current);
    void goNextOrFinish(FIXED_ACCURACY, elapsed);
  };

  const onSkip = () => {
    if (!current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    void goNextOrFinish(0, 1);
  };

  const onCancel = () => {
    setCancelOpen(false);
    router.push("/dashboard");
  };

  if (!planId || !sessionId) return null;

  if (planLoading || !plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!detail || exercises.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-th-text-mut">
        <p>{t.noPlans}</p>
        <Link href="/plans" className="btn-primary mt-4 inline-block">
          {t.plans}
        </Link>
      </div>
    );
  }

  const pctBar = Math.min(100, ((index + 1) / exercises.length) * 100);

  if (phase === "done") {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-th-text">{t.congratulations}</h1>
        <p className="mt-2 text-th-text-mut">{t.trainingCompleted}</p>
        <p className="mt-6 text-3xl font-bold text-sage-600 dark:text-sage-400">%{Math.round(avg)}</p>
        <p className="text-sm text-th-text-mut">{t.averageScore}</p>
        <Link href="/dashboard" className="btn-primary mt-8 inline-block">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <button type="button" onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-th-text-mut hover:text-th-text">
          <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {t.close}
        </button>
        <p className="truncate text-center text-sm font-medium text-th-text">
          {detail.title} · {index + 1}/{exercises.length}
        </p>
        <span className="w-10 shrink-0" />
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-th-muted">
        <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${pctBar}%` }} />
      </div>

      <div className="mb-6 flex min-h-[200px] items-center justify-center rounded-3xl border border-th-border bg-gradient-to-b from-th-subtle to-th-card p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-sage-400/15 text-sage-600 dark:text-sage-400">
            <PersonStanding className="h-12 w-12" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="font-mono text-4xl font-bold tabular-nums text-th-text">{formatTime(timer)}</p>
          {DEV_TIMER && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{t.devTimerNote}</p>}
        </div>
      </div>

      <h2 className="text-xl font-bold text-th-text">{current?.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-th-text-sec">{current?.instructions}</p>

      {next && (
        <p className="mt-4 text-sm text-th-text-mut">
          {t.nextPose}: {next.name}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onComplete} disabled={submitPose.isPending} className="btn-primary flex-1 justify-center">
          {submitPose.isPending ? <LoadingSpinner size="sm" /> : t.completePose}
        </button>
        <button type="button" onClick={onSkip} disabled={submitPose.isPending} className="btn-secondary flex-1 justify-center">
          {t.skipPose}
        </button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title={t.cancelTraining}
        description={t.cancelTrainingDesc}
        confirmLabel={t.close}
        cancelLabel={t.back}
        variant="danger"
        onConfirm={onCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
