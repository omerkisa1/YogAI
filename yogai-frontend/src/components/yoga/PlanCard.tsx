"use client";

import { motion } from "framer-motion";
import type { YogaPlan } from "@/types/yoga";
import { useDeletePlan } from "@/hooks/useYoga";
import toast from "react-hot-toast";

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

interface PlanCardProps {
  plan: YogaPlan;
  index: number;
}

export default function PlanCard({ plan, index }: PlanCardProps) {
  const { deletePlan, loading: deleting } = useDeletePlan();

  const handleDelete = async () => {
    try {
      await deletePlan(plan.id);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const levelKey = plan.level?.toLowerCase() || "beginner";
  const badgeClass = levelColors[levelKey] || levelColors.beginner;
  const createdDate = new Date(plan.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card group"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-charcoal">
            {plan.plan?.title || "Yoga Plan"}
          </h3>
          <p className="mt-1 text-sm text-charcoal-lighter line-clamp-2">
            {plan.plan?.description || "AI-generated yoga plan"}
          </p>
        </div>
        <span className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
          {plan.level || "Beginner"}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-cream-200 px-2.5 py-1 text-xs text-charcoal-light">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {plan.duration} min
        </span>
        {plan.focus_area && (
          <span className="inline-flex items-center rounded-lg bg-clay-50 px-2.5 py-1 text-xs text-clay-500">
            {plan.focus_area}
          </span>
        )}
        <span className="inline-flex items-center rounded-lg bg-sage-50 px-2.5 py-1 text-xs text-sage-600">
          {plan.plan?.poses?.length || 0} poses
        </span>
      </div>

      {plan.plan?.poses && plan.plan.poses.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {plan.plan.poses.slice(0, 3).map((pose, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2">
              <span className="text-xs font-medium text-charcoal">{pose.name}</span>
              <span className="text-xs text-charcoal-lighter">{pose.duration_seconds}s</span>
            </div>
          ))}
          {plan.plan.poses.length > 3 && (
            <p className="px-3 text-xs text-charcoal-lighter">
              +{plan.plan.poses.length - 3} more poses
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-cream-200 pt-3">
        <span className="text-xs text-charcoal-lighter">{createdDate}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500/70 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </motion.div>
  );
}
