"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePlan } from "@/hooks/usePlans";
import { useProfile } from "@/hooks/useProfile";
import { useApp } from "@/components/layout/AppProvider";
import { focusAreaKeys, faceFocusAreaKeys, type Translations } from "@/lib/i18n";
import { normalizePlanType } from "@/lib/poseDomain";
import type { GeneratePlanRequest, PlanType } from "@/types/yoga";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const bodyDurations = [10, 15, 20, 25, 30, 35, 45, 60];
const faceDurations = [5, 10, 15, 20];

function formatPlanErrorMessage(
  details: Record<string, unknown> | undefined,
  fallback: string,
): string {
  if (!details) return fallback;
  const err =
    (typeof details.error === "string" && details.error) ||
    (typeof details.message === "string" && details.message) ||
    fallback;
  const lines = [err];
  const ap = details.available_poses;
  const md = details.max_duration;
  const sug = details.suggestion;
  if (typeof ap === "number") lines.push(`${ap} poz`);
  if (typeof md === "number" && md > 0) lines.push(`~${md} dk`);
  if (typeof sug === "string" && sug) lines.push(sug);
  return lines.join(" · ");
}

function planCreatedToast(planType: PlanType, t: Translations): string {
  return planType === "face" ? t.facePlanCreated : t.planCreated;
}

export type PlanGeneratorFormProps = {
  presetLevel?: string;
  presetDuration?: number;
  presetFocus?: string;
  presetPlanType?: PlanType | "face_hand";
};

export default function PlanGeneratorForm({
  presetLevel,
  presetDuration,
  presetFocus,
  presetPlanType,
}: PlanGeneratorFormProps) {
  const [step, setStep] = useState(0);
  const [planType, setPlanType] = useState<PlanType>("body");
  const router = useRouter();
  const createPlan = useCreatePlan();
  const { data: profile } = useProfile();
  const { t } = useApp();
  const { setValue, watch, getValues } = useForm<GeneratePlanRequest>({
    defaultValues: { level: "", duration: 15, focus_area: "", preferences: "" },
  });

  useEffect(() => {
    if (profile) {
      if (profile.fitness_level) setValue("level", profile.fitness_level);
      if (profile.preferred_duration) setValue("duration", profile.preferred_duration);
    }
  }, [profile, setValue]);

  useEffect(() => {
    const levels = ["beginner", "intermediate", "advanced"] as const;
    if (presetLevel && levels.includes(presetLevel as (typeof levels)[number])) {
      setValue("level", presetLevel);
    }
    if (presetDuration != null && Number.isFinite(presetDuration) && presetDuration > 0) {
      setValue("duration", presetDuration);
    }
    if (presetFocus && [...focusAreaKeys, ...faceFocusAreaKeys].some((a) => a.value === presetFocus)) {
      setValue("focus_area", presetFocus);
      if (faceFocusAreaKeys.some((a) => a.value === presetFocus)) {
        setPlanType("face");
      }
    }
    if (presetPlanType) {
      const normalized = normalizePlanType(presetPlanType);
      setPlanType(normalized);
      if (normalized === "face" && !presetDuration) {
        setValue("duration", 10);
      }
    }
  }, [presetLevel, presetDuration, presetFocus, presetPlanType, setValue]);

  const selectedLevel = watch("level");
  const selectedDuration = watch("duration");
  const selectedFocus = watch("focus_area");

  const steps = [
    t.chooseDomain,
    t.chooseLevel.split(" ")[0],
    t.sessionDuration.split(" ")[0],
    t.focusArea.split(" ")[0],
  ];

  const levels = [
    { value: "beginner", label: t.beginner, desc: t.beginnerDesc },
    { value: "intermediate", label: t.intermediate, desc: t.intermediateDesc },
    { value: "advanced", label: t.advanced, desc: t.advancedDesc },
  ];

  const domains: { value: PlanType; label: string; desc: string }[] = [
    { value: "body", label: t.bodyYoga, desc: t.bodyYogaDesc },
    { value: "face", label: t.faceYoga, desc: t.faceYogaDesc },
  ];

  const currentFocusKeys = planType === "face" ? faceFocusAreaKeys : focusAreaKeys;
  const currentDurations = planType === "face" ? faceDurations : bodyDurations;

  const handleDomainSelect = (d: PlanType) => {
    setPlanType(d);
    setValue("focus_area", "");
    setValue("duration", d === "face" ? 10 : 30);
  };

  const handleGenerate = async () => {
    if (createPlan.isPending) return;
    try {
      const values = getValues();
      await createPlan.mutateAsync({
        ...values,
        plan_type: planType,
        injuries: profile?.injuries?.length ? [...profile.injuries] : undefined,
      });
      toast.success(planCreatedToast(planType, t));
      router.push("/dashboard");
    } catch (e) {
      const details = (e as Error & { apiDetails?: Record<string, unknown> }).apiDetails;
      toast.error(formatPlanErrorMessage(details, t.generateFailed));
    }
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return !!selectedLevel;
    if (step === 2) return !!selectedDuration;
    return true;
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i <= step
                  ? "bg-sage-400 text-white"
                  : "bg-th-subtle text-th-text-mut"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i <= step ? "text-th-text" : "text-th-text-mut"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${i < step ? "bg-sage-400" : "bg-th-border"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card min-h-[320px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-domain"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.chooseDomain}</h2>
              <div className="mt-4 space-y-3">
                {domains.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDomainSelect(d.value)}
                    className={`flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      planType === d.value
                        ? "border-sage-400 bg-sage-400/5 dark:bg-sage-400/10"
                        : "border-th-border hover:border-th-muted"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-th-text">{d.label}</p>
                      <p className="text-xs text-th-text-mut">{d.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.chooseLevel}</h2>
              <p className="text-sm text-th-text-mut">{t.chooseLevelDesc}</p>
              <div className="mt-4 space-y-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setValue("level", lvl.value)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedLevel === lvl.value
                        ? "border-sage-400 bg-sage-400/5 dark:bg-sage-400/10"
                        : "border-th-border hover:border-th-muted"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        selectedLevel === lvl.value
                          ? "border-sage-400 bg-sage-400"
                          : "border-th-muted"
                      }`}
                    >
                      {selectedLevel === lvl.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-th-text">{lvl.label}</p>
                      <p className="text-xs text-th-text-mut">{lvl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.sessionDuration}</h2>
              <p className="text-sm text-th-text-mut">{t.durationDesc}</p>
              {planType === "face" && (
                <p className="text-xs text-purple-700 dark:text-purple-300">{t.faceSessionDuration}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {currentDurations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue("duration", d)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      selectedDuration === d
                        ? "border-sage-400 bg-sage-400/5 dark:bg-sage-400/10"
                        : "border-th-border hover:border-th-muted"
                    }`}
                  >
                    <span className="block text-2xl font-semibold text-th-text">{d}</span>
                    <span className="text-xs text-th-text-mut">{t.minutes}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.focusArea}</h2>
              <p className="text-sm text-th-text-mut">{t.focusAreaDesc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentFocusKeys.map((area) => (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() =>
                      setValue("focus_area", selectedFocus === area.value ? "" : area.value)
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedFocus === area.value
                        ? "border-sage-400 bg-sage-400 text-white"
                        : "border-th-border text-th-text-sec hover:border-sage-300 dark:hover:border-sage-600"
                    }`}
                  >
                    {t[area.key]}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-th-text">
                  {t.additionalPrefs}
                </label>
                <textarea
                  onChange={(e) => setValue("preferences", e.target.value)}
                  placeholder={t.prefsPlaceholder}
                  rows={3}
                  className="input-field mt-2 resize-none"
                />
              </div>
              <p className="text-xs text-th-text-mut">{t.planInjuriesMergedHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-0"
        >
          {t.back}
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-50"
          >
            {t.continue}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={createPlan.isPending}
            className="btn-primary min-w-[160px] disabled:opacity-50"
          >
            {createPlan.isPending ? <LoadingSpinner size="sm" /> : t.generatePlan}
          </button>
        )}
      </div>
    </div>
  );
}
