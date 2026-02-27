"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/components/layout/AppProvider";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/useYoga";
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

export default function ProfilePage() {
  const { t, locale } = useApp();
  const { user } = useAuthContext();
  const { profile, loading } = useProfile();
  const { saveProfile, loading: saving } = useSaveProfile();
  const { plans } = usePlans();

  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState(0);
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [preferredDuration, setPreferredDuration] = useState(30);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBirthYear(profile.birth_year || 0);
      setGender(profile.gender || "");
      setHeightCm(profile.height_cm || 0);
      setWeightKg(profile.weight_kg || 0);
      setFitnessLevel(profile.fitness_level || "");
      setPreferredDuration(profile.preferred_duration || 30);
      setInjuries(profile.injuries || []);
      setGoals(profile.goals || []);
    }
  }, [profile]);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    try {
      await saveProfile({
        display_name: displayName,
        birth_year: birthYear,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        fitness_level: fitnessLevel,
        injuries,
        goals,
        preferred_duration: preferredDuration,
        profile_image_url: profile?.profile_image_url || "",
      });
      toast.success(t.profileSaved);
      setEditing(false);
    } catch {
      toast.error(t.profileSaveFailed);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const favoriteCount = plans.filter((p) => p.is_favorite).length;

  const levels = [
    { value: "beginner", label: t.beginner },
    { value: "intermediate", label: t.intermediate },
    { value: "advanced", label: t.advanced },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-400/10 text-2xl font-bold text-sage-500 dark:text-sage-400">
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt=""
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-th-text">{t.profileTitle}</h1>
              <p className="text-sm text-th-text-mut">{t.profileSubtitle}</p>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary text-sm"
            >
              {t.editProfile}
            </button>
          )}
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-sage-500 dark:text-sage-400">{plans.length}</p>
            <p className="text-xs text-th-text-mut">{t.totalPlans}</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-sage-500 dark:text-sage-400">{favoriteCount}</p>
            <p className="text-xs text-th-text-mut">{t.favoritePlans}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm font-semibold text-sage-500 dark:text-sage-400">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { month: "short", year: "numeric" })
                : "-"}
            </p>
            <p className="text-xs text-th-text-mut">{t.joined}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 text-base font-semibold text-th-text">{t.basicInfo}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.displayName}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!editing}
                  className="input-field disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.birthYear}</label>
                <input
                  type="number"
                  value={birthYear || ""}
                  onChange={(e) => setBirthYear(parseInt(e.target.value) || 0)}
                  disabled={!editing}
                  placeholder="1990"
                  className="input-field disabled:opacity-60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.gender}</label>
                <div className="flex flex-wrap gap-2">
                  {genderOptions.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      disabled={!editing}
                      onClick={() => setGender(g.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
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
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-base font-semibold text-th-text">{t.bodyStats}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.heightCm}</label>
                <input
                  type="number"
                  value={heightCm || ""}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                  disabled={!editing}
                  placeholder="170"
                  className="input-field disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.weightKg}</label>
                <input
                  type="number"
                  value={weightKg || ""}
                  onChange={(e) => setWeightKg(parseInt(e.target.value) || 0)}
                  disabled={!editing}
                  placeholder="70"
                  className="input-field disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.fitnessLevel}</label>
                <div className="flex gap-2">
                  {levels.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      disabled={!editing}
                      onClick={() => setFitnessLevel(lvl.value)}
                      className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
                        fitnessLevel === lvl.value
                          ? "border-sage-400 bg-sage-400/5 text-sage-600 dark:bg-sage-400/10 dark:text-sage-400"
                          : "border-th-border text-th-text-sec hover:border-th-muted"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-th-text">{t.preferredDuration}</label>
                <div className="flex gap-2">
                  {durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={!editing}
                      onClick={() => setPreferredDuration(d)}
                      className={`flex-1 rounded-xl border-2 px-3 py-2 text-center text-sm font-medium transition-all disabled:opacity-60 ${
                        preferredDuration === d
                          ? "border-sage-400 bg-sage-400/5 text-sage-600 dark:bg-sage-400/10 dark:text-sage-400"
                          : "border-th-border text-th-text-sec hover:border-th-muted"
                      }`}
                    >
                      {d}{locale === "tr" ? "dk" : "m"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-1 text-base font-semibold text-th-text">{t.injuriesLabel}</h2>
            <p className="mb-4 text-sm text-th-text-mut">{t.injuriesDesc}</p>
            <div className="flex flex-wrap gap-2">
              {injuryOptions.map((inj) => (
                <button
                  key={inj.value}
                  type="button"
                  disabled={!editing}
                  onClick={() => toggleItem(injuries, inj.value, setInjuries)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
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

          <div className="card">
            <h2 className="mb-1 text-base font-semibold text-th-text">{t.goalsLabel}</h2>
            <p className="mb-4 text-sm text-th-text-mut">{t.goalsDesc}</p>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  disabled={!editing}
                  onClick={() => toggleItem(goals, goal.value, setGoals)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
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

          {editing && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? <LoadingSpinner size="sm" /> : t.saveProfile}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
