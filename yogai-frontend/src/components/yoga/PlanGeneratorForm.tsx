"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useGeneratePlan } from "@/hooks/useYoga";
import type { GeneratePlanRequest } from "@/types/yoga";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const steps = ["Level", "Duration", "Focus"];

const levels = [
  { value: "beginner", label: "Beginner", desc: "New to yoga or getting back into practice" },
  { value: "intermediate", label: "Intermediate", desc: "Comfortable with basic poses" },
  { value: "advanced", label: "Advanced", desc: "Ready for challenging sequences" },
];

const focusAreas = [
  "Flexibility", "Strength", "Balance", "Relaxation",
  "Back Pain", "Stress Relief", "Morning Energy", "Sleep",
];

const durations = [15, 30, 45, 60];

export default function PlanGeneratorForm() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { generatePlan, loading } = useGeneratePlan();
  const { setValue, watch, getValues } = useForm<GeneratePlanRequest>({
    defaultValues: { level: "", duration: 30, focus_area: "", preferences: "" },
  });

  const selectedLevel = watch("level");
  const selectedDuration = watch("duration");
  const selectedFocus = watch("focus_area");

  const handleGenerate = async () => {
    if (loading) return;
    try {
      await generatePlan(getValues());
      toast.success("Yoga plan created!");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to generate plan");
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
                  : "bg-cream-200 text-charcoal-lighter"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i <= step ? "text-charcoal" : "text-charcoal-lighter"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${i < step ? "bg-sage-400" : "bg-cream-300"}`} />
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
              <h2 className="text-lg font-semibold text-charcoal">Choose Your Level</h2>
              <p className="text-sm text-charcoal-lighter">Select the level that best describes your yoga experience.</p>
              <div className="mt-4 space-y-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setValue("level", lvl.value)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedLevel === lvl.value
                        ? "border-sage-400 bg-sage-400/5"
                        : "border-cream-200 hover:border-cream-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        selectedLevel === lvl.value
                          ? "border-sage-400 bg-sage-400"
                          : "border-cream-300"
                      }`}
                    >
                      {selectedLevel === lvl.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{lvl.label}</p>
                      <p className="text-xs text-charcoal-lighter">{lvl.desc}</p>
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
              <h2 className="text-lg font-semibold text-charcoal">Session Duration</h2>
              <p className="text-sm text-charcoal-lighter">How long would you like your yoga session to be?</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {durations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue("duration", d)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      selectedDuration === d
                        ? "border-sage-400 bg-sage-400/5"
                        : "border-cream-200 hover:border-cream-300"
                    }`}
                  >
                    <span className="block text-2xl font-semibold text-charcoal">{d}</span>
                    <span className="text-xs text-charcoal-lighter">minutes</span>
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
              <h2 className="text-lg font-semibold text-charcoal">Focus Area</h2>
              <p className="text-sm text-charcoal-lighter">What would you like to focus on? (Optional)</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() =>
                      setValue("focus_area", selectedFocus === area ? "" : area)
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedFocus === area
                        ? "border-sage-400 bg-sage-400 text-white"
                        : "border-cream-300 text-charcoal-light hover:border-sage-300"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-charcoal">
                  Additional Preferences
                </label>
                <textarea
                  onChange={(e) => setValue("preferences", e.target.value)}
                  placeholder="Any injuries, specific goals, or preferences..."
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
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary min-w-[160px] disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Generate Plan"}
          </button>
        )}
      </div>
    </div>
  );
}
