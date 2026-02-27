"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useGeneratePlan } from "@/hooks/useYoga";
import { useProfile } from "@/hooks/useProfile";
import { useApp } from "@/components/layout/AppProvider";
import { focusAreaKeys } from "@/lib/i18n";
import type { GeneratePlanRequest } from "@/types/yoga";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const durations = [15, 30, 45, 60];

export default function PlanGeneratorForm() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { generatePlan, loading } = useGeneratePlan();
  const { profile } = useProfile();
  const { t, locale } = useApp();
  const { setValue, watch, getValues } = useForm<GeneratePlanRequest>({
    defaultValues: { level: "", duration: 30, focus_area: "", preferences: "" },
  });

  useEffect(() => {
    if (profile) {
      if (profile.fitness_level) setValue("level", profile.fitness_level);
      if (profile.preferred_duration) setValue("duration", profile.preferred_duration);
    }
  }, [profile, setValue]);

  const selectedLevel = watch("level");
  const selectedDuration = watch("duration");
  const selectedFocus = watch("focus_area");

  const steps = [
    t.chooseLevel.split(" ")[0],
    t.sessionDuration.split(" ")[0],
    t.focusArea.split(" ")[0],
  ];

  const levels = [
    { value: "beginner", label: t.beginner, desc: t.beginnerDesc },
    { value: "intermediate", label: t.intermediate, desc: t.intermediateDesc },
    { value: "advanced", label: t.advanced, desc: t.advancedDesc },
  ];

  const handleGenerate = async () => {
    if (loading) return;
    try {
      const values = getValues();
      await generatePlan({ ...values, language: locale });
      toast.success(t.planCreated);
      router.push("/dashboard");
    } catch {
      toast.error(t.generateFailed);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!selectedLevel;
    if (step === 1) return !!selectedDuration;
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
              key="step-0"
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

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.sessionDuration}</h2>
              <p className="text-sm text-th-text-mut">{t.durationDesc}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {durations.map((d) => (
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

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-th-text">{t.focusArea}</h2>
              <p className="text-sm text-th-text-mut">{t.focusAreaDesc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusAreaKeys.map((area) => (
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
            disabled={loading}
            className="btn-primary min-w-[160px] disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : t.generatePlan}
          </button>
        )}
      </div>
    </div>
  );
}
