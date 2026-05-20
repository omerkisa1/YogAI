"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { usePlan, useDeletePlan, useUpdatePlan } from "@/hooks/usePlans";
import { useStartSession } from "@/hooks/useTraining";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import BackLink from "@/components/shared/BackLink";
import { getLocalizedPlanSafe, inferPlanType } from "@/lib/planHelpers";
import { isFacePlanType } from "@/lib/poseDomain";
import { useRef, useState } from "react";
import { Camera, Pin, PinOff, Star, Trash2 } from "lucide-react";

export default function PlanDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { t, locale } = useApp();
  const { data: plan, isLoading, error, refetch } = usePlan(id);
  const deleteMutation = useDeletePlan();
  const updateMutation = useUpdatePlan();
  const startSession = useStartSession();
  const [confirmDel, setConfirmDel] = useState(false);
  const startingRef = useRef(false);

  const detail = plan ? getLocalizedPlanSafe(plan, locale, t.yogaPlan) : null;
  const planType = plan ? inferPlanType(plan) : "body";

  const handleStartTraining = async () => {
    if (!plan || startingRef.current || startSession.isPending) return;
    startingRef.current = true;
    try {
      const res = await startSession.mutateAsync(plan.id);
      router.push(`/training/session?planId=${plan.id}&sessionId=${encodeURIComponent(res.session_id)}`);
    } catch {
      toast.error(t.loadError);
    } finally {
      startingRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    try {
      await deleteMutation.mutateAsync(plan.id);
      toast.success(t.planDeleted);
      router.replace("/plans");
    } catch {
      toast.error(t.failedDelete);
    }
    setConfirmDel(false);
  };

  const toggleFavorite = async () => {
    if (!plan) return;
    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: { is_favorite: !(plan.is_favorite ?? false) },
      });
      refetch();
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  const togglePin = async () => {
    if (!plan) return;
    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: { is_pinned: !(plan.is_pinned ?? false) },
      });
      refetch();
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !plan || !detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-th-text-mut">{t.loadError}</p>
        <button type="button" onClick={() => refetch()} className="btn-primary mt-4">
          {t.reload}
        </button>
        <div className="mt-4 flex justify-center">
          <BackLink href="/plans">{t.allPlans}</BackLink>
        </div>
      </div>
    );
  }

  const exercises = detail.exercises;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <BackLink href="/plans" className="mb-6">
        {t.back}
      </BackLink>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-400/90 via-sage-500/80 to-clay-400/90 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight md:text-3xl">{detail.title}</h1>
              <p className="mt-2 text-sm text-white/90">
                {detail.difficulty || plan.level || t.beginner} · {detail.focus_area || plan.focus_area || "—"} ·{" "}
                {detail.total_duration_min || plan.duration || 0} {t.minutesShort}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              >
                <Star
                  className={`h-3.5 w-3.5 shrink-0 ${plan.is_favorite ? "fill-white text-white" : "text-white"}`}
                  strokeWidth={2}
                  aria-hidden
                />
                {t.favorite}
              </button>
              <button
                type="button"
                onClick={togglePin}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              >
                {plan.is_pinned ? (
                  <Pin className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2} aria-hidden />
                ) : (
                  <PinOff className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2} aria-hidden />
                )}
                {t.pin}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/40 px-3 py-2 text-xs font-medium backdrop-blur-sm hover:bg-red-500/60 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2} aria-hidden />
                {t.deleteTxt}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-th-text">{t.poseDetailMeta}</h2>
            <p className="text-sm leading-relaxed text-th-text-sec">{detail.description}</p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-th-text">
              {t.exerciseBreakdown} ({exercises.length})
            </h2>
            <ul className="space-y-4">
              {exercises.map((ex, i) => (
                <li key={`${ex.pose_id}-${i}`} className="rounded-2xl border border-th-border bg-th-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-400 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-th-text">{ex.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-th-text-mut">{ex.instructions}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs font-medium text-th-text-sec">
                        {ex.duration_min} {t.minutesShort}
                      </span>
                      {ex.is_analyzable && (
                        <Camera className="h-3.5 w-3.5 shrink-0 text-sage-600 dark:text-sage-400" strokeWidth={2} aria-hidden />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {isFacePlanType(planType) && (
            <p className="mb-4 text-sm text-purple-800 dark:text-purple-200">{t.faceTrainingHint}</p>
          )}

          <button
            type="button"
            onClick={handleStartTraining}
            disabled={startSession.isPending || exercises.length === 0}
            className="btn-primary w-full justify-center py-3 md:w-auto"
          >
            {startSession.isPending ? <LoadingSpinner size="sm" /> : t.startTraining}
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmDel}
        title={t.deletePlanConfirm}
        description={t.deleteTrainingDesc}
        confirmLabel={t.deleteTxt}
        cancelLabel={t.back}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}
