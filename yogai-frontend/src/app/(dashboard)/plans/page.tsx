"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePlans } from "@/hooks/usePlans";
import { useApp } from "@/components/layout/AppProvider";
import PlanCard from "@/components/yoga/PlanCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { getEffectivePlanSource } from "@/lib/planMeta";

type FilterKey = "all" | "ai" | "custom" | "favorites";

export default function PlansPage() {
  const { t } = useApp();
  const { plans, loading, refetch, error, isError } = usePlans();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      const src = getEffectivePlanSource(p);
      if (filter === "ai") return src === "ai";
      if (filter === "custom") return src === "custom";
      if (filter === "favorites") return !!(p.is_favorite ?? p.plan_en?.is_favorite);
      return true;
    });
  }, [plans, filter]);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: t.filterAll },
    { key: "ai", label: t.filterAi },
    { key: "custom", label: t.filterCustom },
    { key: "favorites", label: t.filterFavorites },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text">{t.myPlansTitle}</h1>
          <p className="mt-1 text-sm text-th-text-mut">
            {plans.length} {plans.length !== 1 ? t.planPlural : t.plan} {t.planCreatedCount}
          </p>
        </div>
        <Link href="/create-plan" className="btn-primary inline-flex shrink-0 items-center justify-center">
          {t.createPlanCta}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-sage-400 text-white dark:bg-sage-500"
                : "border border-th-border bg-th-card text-th-text-sec hover:border-sage-300 dark:hover:border-sage-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <p>{t.loadError}</p>
          <button type="button" onClick={() => refetch()} className="mt-2 font-medium underline">
            {t.reload}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-th-border py-16 md:py-20"
        >
          <p className="text-center text-th-text-mut">{t.noPlans}</p>
          <Link href="/create-plan" className="btn-primary mt-6">
            {t.createPlanCta}
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              detailHref={`/plans/${plan.id}`}
              onUpdated={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
