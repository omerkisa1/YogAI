"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/layout/AppProvider";
import PlanGeneratorForm from "@/components/yoga/PlanGeneratorForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { PlanType } from "@/types/yoga";

function parsePlanType(raw: string | null): PlanType | undefined {
  if (raw === "body" || raw === "face") return raw;
  if (raw === "face_hand") return "face";
  return undefined;
}

function CreatePlanContent() {
  const { t } = useApp();
  const searchParams = useSearchParams();
  const level = searchParams.get("level") ?? undefined;
  const durationRaw = searchParams.get("duration");
  const focus = searchParams.get("focus_area") ?? undefined;
  const presetPlanType = parsePlanType(searchParams.get("plan_type"));
  const duration =
    durationRaw != null && durationRaw !== ""
      ? Number.parseInt(durationRaw, 10)
      : undefined;
  const presetDuration =
    duration != null && Number.isFinite(duration) && duration > 0 ? duration : undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-2xl font-bold text-th-text">{t.createPlanTitle}</h1>
        <p className="mt-2 text-sm text-th-text-mut">{t.createPlanDesc}</p>
      </motion.div>
      <PlanGeneratorForm
        presetLevel={level}
        presetDuration={presetDuration}
        presetFocus={focus}
        presetPlanType={presetPlanType}
      />
    </div>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CreatePlanContent />
    </Suspense>
  );
}
