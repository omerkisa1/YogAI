"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePlans } from "@/hooks/useYoga";
import { useAuthContext } from "@/components/layout/AuthProvider";
import PlanCard from "@/components/yoga/PlanCard";
import PlanDetailModal from "@/components/yoga/PlanDetailModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { YogaPlan } from "@/types/yoga";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { plans, loading, refetch } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<YogaPlan | null>(null);

  const handlePlanUpdated = () => {
    refetch();
    if (selectedPlan) {
      const fresh = plans.find((p) => p.id === selectedPlan.id);
      if (fresh) setSelectedPlan(fresh);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-2xl font-bold text-charcoal">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-charcoal-lighter">
          Here are your personalized yoga plans
        </p>
      </motion.div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Your Plans</h2>
          <p className="text-sm text-charcoal-lighter">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <Link href="/create-plan" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Plan
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-300 py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-400/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#889E81" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-charcoal">No plans yet</h3>
          <p className="mt-1 text-sm text-charcoal-lighter">
            Create your first AI-powered yoga plan
          </p>
          <Link href="/create-plan" className="btn-primary mt-6">
            Create Your First Plan
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              onClick={() => setSelectedPlan(plan)}
              onUpdated={handlePlanUpdated}
            />
          ))}
        </div>
      )}

      <PlanDetailModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onUpdated={handlePlanUpdated}
      />
    </div>
  );
}
