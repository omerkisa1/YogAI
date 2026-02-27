"use client";

import { motion } from "framer-motion";
import type { YogaPlan } from "@/types/yoga";
import { useUpdatePlan } from "@/hooks/useYoga";
import { useApp } from "@/components/layout/AppProvider";
import toast from "react-hot-toast";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface PlanCardProps {
  plan: YogaPlan;
  index: number;
  onClick: () => void;
  onUpdated: () => void;
}

export default function PlanCard({ plan, index, onClick, onUpdated }: PlanCardProps) {
  const { updatePlan, loading: updating } = useUpdatePlan();
  const { t, locale } = useApp();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updatePlan(plan.id, { is_favorite: !plan.is_favorite });
      onUpdated();
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updatePlan(plan.id, { is_pinned: !plan.is_pinned });
      onUpdated();
    } catch {
      toast.error(t.failedUpdate);
    }
  };

  const diffKey = (plan.plan?.difficulty || plan.level || "beginner").toLowerCase();
  const badgeClass = difficultyColors[diffKey] || difficultyColors.beginner;
  const createdDate = new Date(plan.created_at).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  const exercises = plan.plan?.exercises || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={onClick}
      className="card group cursor-pointer ring-1 ring-transparent transition-all hover:ring-sage-300/40 dark:hover:ring-sage-600/30 hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {plan.is_pinned && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#3B82F6" className="shrink-0">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
            )}
            <h3 className="text-base font-semibold text-th-text truncate">
              {plan.plan?.title || t.yogaPlan}
            </h3>
          </div>
          <p className="text-sm text-th-text-mut line-clamp-2">
            {plan.plan?.description || t.aiGenerated}
          </p>
        </div>
        <span className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
          {plan.plan?.difficulty || plan.level || t.beginner}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-th-subtle px-2.5 py-1 text-xs text-th-text-sec">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {plan.plan?.total_duration_min || plan.duration} {t.min}
        </span>
        {(plan.plan?.focus_area || plan.focus_area) && (
          <span className="inline-flex items-center rounded-lg bg-clay-50 dark:bg-clay-900/20 px-2.5 py-1 text-xs text-clay-500 dark:text-clay-300">
            {plan.plan?.focus_area || plan.focus_area}
          </span>
        )}
        <span className="inline-flex items-center rounded-lg bg-sage-50 dark:bg-sage-900/20 px-2.5 py-1 text-xs text-sage-600 dark:text-sage-400">
          {exercises.length} {t.exercises}
        </span>
      </div>

      {exercises.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="rounded-lg bg-th-surface px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-th-text">{ex.name}</span>
                <span className="ml-2 shrink-0 text-xs text-th-text-mut">{ex.duration_min} {t.min}</span>
              </div>
              {ex.focus_point && (
                <p className="mt-0.5 text-[10px] text-sage-500 dark:text-sage-400">{ex.focus_point}</p>
              )}
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="px-3 text-xs text-th-text-mut">
              +{exercises.length - 3} {t.moreExercises}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-th-border pt-3">
        <span className="text-xs text-th-text-mut">{createdDate}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={updating}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
              plan.is_favorite
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-th-text-mut hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/15"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={plan.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={handlePin}
            disabled={updating}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
              plan.is_pinned
                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                : "text-th-text-mut hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/15"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={plan.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
