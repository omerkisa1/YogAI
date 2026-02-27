"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/layout/AppProvider";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useSaveProfile } from "@/hooks/useProfile";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import type { Translations } from "@/lib/i18n";

const injuryOptions: Array<{ value: string; key: keyof Translations }> = [
  { value: "back_pain", key: "injBackPain" },
  { value: "knee_injury", key: "injKneeInjury" },
  { value: "wrist_sensitivity", key: "injWristSensitivity" },
  { value: "neck_tension", key: "injNeckTension" },
  { value: "shoulder_injury", key: "injShoulderInjury" },
  { value: "hip_pain", key: "injHipPain" },
  { value: "ankle_injury", key: "injAnkleInjury" },
];

const goalOptions: Array<{ value: string; key: keyof Translations }> = [
  { value: "flexibility", key: "goalFlexibility" },
  { value: "strength", key: "goalStrength" },
  { value: "balance", key: "goalBalance" },
  { value: "weight_loss", key: "goalWeightLoss" },
  { value: "stress_relief", key: "goalStressRelief" },
  { value: "better_sleep", key: "goalBetterSleep" },
  { value: "pain_management", key: "goalPainManagement" },
  { value: "energy", key: "goalEnergy" },
];

const genderOptions: Array<{ value: string; key: keyof Translations }> = [
  { value: "male", key: "male" },
  { value: "female", key: "female" },
  { value: "other", key: "other" },
  { value: "", key: "preferNotToSay" },
];

const durations = [15, 30, 45, 60];

export default function OnboardingPage() {
  const { t, locale } = useApp();
  const { user } = useAuthContext();
  const { saveProfile, loading: saving } = useSaveProfile();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [birthYear, setBirthYear] = useState(0);
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [preferredDuration, setPreferredDuration] = useState(30);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  const steps = [t.onboardingStep1, t.onboardingStep2, t.onboardingStep3];

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const levels = [
    { value: "beginner", label: t.beginner, desc: t.beginnerDesc },
    { value: "intermediate", label: t.intermediate, desc: t.intermediateDesc },
    { value: "advanced", label: t.advanced, desc: t.advancedDesc },
  ];

  const handleFinish = async () => {
    try {
      await saveProfile({
        display_name: displayName || user?.email?.split("@")[0] || "User",
        birth_year: birthYear,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        fitness_level: fitnessLevel,
        injuries,
        goals,
        preferred_duration: preferredDuration,
        profile_image_url: "",
      });
      toast.success(t.profileSaved);
      router.replace("/dashboard");
    } catch {
      toast.error(t.profileSaveFailed);
    }
  };

  const handleSkip = () => {
    router.replace("/dashboard");
  };

  const canProceed = () => {
    if (step === 0) return displayName.trim().length > 0;
    return true;
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-400 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-th-text">{t.onboardingTitle}</h1>
          <p className="mt-1 text-sm text-th-text-mut">{t.onboardingSubtitle}</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i <= step ? "bg-sage-400 text-white" : "bg-th-subtle text-th-text-mut"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= step ? "text-th-text" : "text-th-text-mut"}`}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 ${i < step ? "bg-sage-400" : "bg-th-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="onb-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-th-text">{t.basicInfo}</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-th-text">{t.displayName}</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.email?.split("@")[0] || ""}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-th-text">{t.birthYear}</label>
                  <input
                    type="number"
                    value={birthYear || ""}
                    onChange={(e) => setBirthYear(parseInt(e.target.value) || 0)}
                    placeholder="1990"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-th-text">{t.gender}</label>
                  <div className="flex flex-wrap gap-2">
                    {genderOptions.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setGender(g.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          gender === g.value
                            ? "border-sage-400 bg-sage-400 text-white"
                            : "border-th-border text-th-text-sec hover:border-sage-300 dark:hover:border-sage-600"
                        }`}
                      >
                        {t[g.key]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="onb-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-th-text">{t.bodyStats}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-th-text">{t.heightCm}</label>
                    <input
                      type="number"
                      value={heightCm || ""}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                      placeholder="170"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-th-text">{t.weightKg}</label>
                    <input
                      type="number"
                      value={weightKg || ""}
                      onChange={(e) => setWeightKg(parseInt(e.target.value) || 0)}
                      placeholder="70"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-th-text">{t.fitnessLevel}</label>
                  <div className="space-y-2">
                    {levels.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setFitnessLevel(lvl.value)}
                        className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          fitnessLevel === lvl.value
                            ? "border-sage-400 bg-sage-400/5 dark:bg-sage-400/10"
                            : "border-th-border hover:border-th-muted"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            fitnessLevel === lvl.value ? "border-sage-400 bg-sage-400" : "border-th-muted"
                          }`}
                        >
                          {fitnessLevel === lvl.value && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-th-text">{lvl.label}</p>
                          <p className="text-xs text-th-text-mut">{lvl.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-th-text">{t.preferredDuration}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPreferredDuration(d)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          preferredDuration === d
                            ? "border-sage-400 bg-sage-400/5 dark:bg-sage-400/10"
                            : "border-th-border hover:border-th-muted"
                        }`}
                      >
                        <span className="block text-lg font-semibold text-th-text">{d}</span>
                        <span className="text-xs text-th-text-mut">{locale === "tr" ? "dk" : "min"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="onb-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold text-th-text">{t.injuriesLabel}</h2>
                  <p className="mt-1 text-sm text-th-text-mut">{t.injuriesDesc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {injuryOptions.map((inj) => (
                      <button
                        key={inj.value}
                        type="button"
                        onClick={() => toggleItem(injuries, inj.value, setInjuries)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          injuries.includes(inj.value)
                            ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400"
                            : "border-th-border text-th-text-sec hover:border-red-300 dark:hover:border-red-500/30"
                        }`}
                      >
                        {t[inj.key]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-th-text">{t.goalsLabel}</h2>
                  <p className="mt-1 text-sm text-th-text-mut">{t.goalsDesc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => toggleItem(goals, goal.value, setGoals)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          goals.includes(goal.value)
                            ? "border-sage-400 bg-sage-400 text-white"
                            : "border-th-border text-th-text-sec hover:border-sage-300 dark:hover:border-sage-600"
                        }`}
                      >
                        {t[goal.key]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary"
            >
              {t.back}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-th-text-mut transition-colors hover:text-th-text"
            >
              {t.skip}
            </button>
          )}

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
              onClick={handleFinish}
              disabled={saving}
              className="btn-primary min-w-[160px] disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" /> : t.finish}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
