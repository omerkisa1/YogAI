"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { YogaPlan } from "@/types/yoga";
import { useUpdatePlan, useDeletePlan } from "@/hooks/useYoga";
import { useApp } from "@/components/layout/AppProvider";
import toast from "react-hot-toast";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface PlanDetailModalProps {
  plan: YogaPlan | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function PlanDetailModal({ plan, onClose, onUpdated }: PlanDetailModalProps) {
  const { updatePlan, loading: updating } = useUpdatePlan();
  const { deletePlan, loading: deleting } = useDeletePlan();
  const { t, locale } = useApp();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (plan) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [plan, handleKeyDown]);

  const handleToggleFavorite = async () => {
    if (!plan) return;
    try {
      await updatePlan(plan.id, { is_favorite: !plan.is_favorite });
      onUpdated();
      toast.success(plan.is_favorite ? t.removedFavorite : t.addedFavorite);
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  const handleTogglePin = async () => {
    if (!plan) return;
    try {
      await updatePlan(plan.id, { is_pinned: !plan.is_pinned });
      onUpdated();
      toast.success(plan.is_pinned ? t.unpinned : t.pinnedTop);
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    try {
      await deletePlan(plan.id);
      onUpdated();
      onClose();
      toast.success(t.planDeleted);
    } catch {
      toast.error(t.failedDelete);
    }
  };

  if (!plan) return null;

  const detail = plan.plan;
  const exercises = detail?.exercises || [];
  const diffKey = (detail?.difficulty || plan.level || "beginner").toLowerCase();
  const badgeClass = difficultyColors[diffKey] || difficultyColors.beginner;
  const createdDate = new Date(plan.created_at).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-th-card shadow-2xl"
        >
          <div className="shrink-0 border-b border-th-border px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {plan.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                      {t.pinned}
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${badgeClass}`}>
                    {detail?.difficulty || plan.level || t.beginner}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-th-text leading-tight">
                  {detail?.title || t.yogaPlan}
                </h2>
                <p className="mt-1 text-sm text-th-text-mut">{createdDate}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-th-text-mut transition-colors hover:bg-th-subtle hover:text-th-text"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  plan.is_favorite
                    ? "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-th-subtle text-th-text-mut hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-900/15"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={plan.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {plan.is_favorite ? t.favorited : t.favorite}
              </button>
              <button
                type="button"
                onClick={handleTogglePin}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  plan.is_pinned
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-th-subtle text-th-text-mut hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/15"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={plan.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                </svg>
                {plan.is_pinned ? t.pinned : t.pin}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium bg-th-subtle text-th-text-mut transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/15 dark:hover:text-red-400 disabled:opacity-50 ml-auto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                {deleting ? t.deleting : t.deleteTxt}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {detail?.description && (
              <div className="rounded-2xl bg-sage-50/60 dark:bg-sage-900/15 p-4">
                <p className="text-sm leading-relaxed text-th-text-sec">{detail.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-th-subtle px-3 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#889E81" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-sm font-medium text-th-text">
                  {detail?.total_duration_min || plan.duration} {t.minTotal}
                </span>
              </div>
              {(detail?.focus_area || plan.focus_area) && (
                <div className="flex items-center gap-2 rounded-xl bg-clay-50 dark:bg-clay-900/20 px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                  <span className="text-sm font-medium text-th-text">{detail?.focus_area || plan.focus_area}</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-th-subtle px-3 py-2">
                <span className="text-sm font-medium text-th-text">{exercises.length} {t.exercises}</span>
              </div>
            </div>

            {exercises.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-th-text">{t.exerciseBreakdown}</h3>
                {exercises.map((ex, i) => (
                  <div key={i} className="rounded-2xl border border-th-border bg-th-card p-4 transition-colors hover:border-sage-300/50 dark:hover:border-sage-700/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sage-400 text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-th-text">{ex.name}</h4>
                      </div>
                      <span className="shrink-0 rounded-lg bg-th-subtle px-2.5 py-1 text-xs font-medium text-th-text-sec">
                        {ex.duration_min} {t.min}
                      </span>
                    </div>

                    {ex.instructions && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-th-text-sec mb-0.5">{t.instructions}</p>
                        <p className="text-xs leading-relaxed text-th-text-mut">{ex.instructions}</p>
                      </div>
                    )}

                    {ex.focus_point && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-sage-500 dark:text-sage-400 mb-0.5">{t.focusPoint}</p>
                        <p className="text-xs leading-relaxed text-th-text-mut">{ex.focus_point}</p>
                      </div>
                    )}

                    {ex.benefit && (
                      <div className="rounded-lg bg-sage-50/50 dark:bg-sage-900/15 px-3 py-2">
                        <p className="text-xs leading-relaxed text-sage-600 dark:text-sage-400">{ex.benefit}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
