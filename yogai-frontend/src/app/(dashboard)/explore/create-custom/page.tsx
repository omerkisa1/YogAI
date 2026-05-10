"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAllPoses } from "@/hooks/usePoses";
import { useCreateCustomPlan } from "@/hooks/usePlans";
import { useProfile } from "@/hooks/useProfile";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { colors } from "@/lib/colors";
import { categoryBorder } from "@/lib/exploreMeta";
import type { Translations } from "@/lib/i18n";

type Entry = { pose_id: string; duration_min: number };

function catLabel(c: string, t: Translations): string {
  const k = c.toLowerCase();
  if (k === "standing") return t.categoryStanding;
  if (k === "seated") return t.categorySeated;
  if (k === "prone") return t.categoryProne;
  if (k === "supine") return t.categorySupine;
  if (k === "inversion") return t.categoryInversion;
  return c;
}

export default function CreateCustomPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useApp();
  const { data: poses = [], isLoading } = useAllPoses();
  const { data: profile } = useProfile();
  const createPlan = useCreateCustomPlan();

  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mq, setMq] = useState("");
  const [mcat, setMcat] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addParam = searchParams.get("add");

  useEffect(() => {
    if (!addParam || !poses.length) return;
    const exists = poses.some((p) => p.pose_id === addParam);
    if (!exists) return;
    setEntries((prev) => {
      if (prev.some((e) => e.pose_id === addParam)) return prev;
      return [...prev, { pose_id: addParam, duration_min: 3 }];
    });
  }, [addParam, poses]);

  const poseMap = useMemo(() => Object.fromEntries(poses.map((p) => [p.pose_id, p])), [poses]);

  const injuryOverlap = useMemo(() => {
    const inj = profile?.injuries ?? [];
    if (!inj.length || !entries.length) return [];
    const warnings: string[] = [];
    entries.forEach((e) => {
      const p = poseMap[e.pose_id];
      if (!p) return;
      p.contraindications.forEach((c) => {
        if (inj.includes(c)) warnings.push(`${p.pose_id}:${c}`);
      });
    });
    return warnings;
  }, [entries, poseMap, profile?.injuries]);

  const totalMin = entries.reduce((s, e) => s + e.duration_min, 0);
  const analyzable = entries.filter((e) => poseMap[e.pose_id]?.is_analyzable).length;

  const modalFiltered = useMemo(() => {
    const ql = mq.trim().toLowerCase();
    return poses.filter((p) => {
      if (mcat && p.category.toLowerCase() !== mcat.toLowerCase()) return false;
      if (ql) {
        const en = p.name_en.toLowerCase();
        const tr = p.name_tr.toLowerCase();
        if (!en.includes(ql) && !tr.includes(ql)) return false;
      }
      return true;
    });
  }, [poses, mq, mcat]);

  const toggleSel = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const addSelected = () => {
    setEntries((prev) => {
      const next = [...prev];
      selectedIds.forEach((id) => {
        if (!next.some((e) => e.pose_id === id)) next.push({ pose_id: id, duration_min: 3 });
      });
      return next;
    });
    setSelectedIds(new Set());
    setModalOpen(false);
    setMq("");
    setMcat("");
  };

  const removeEntry = (poseId: string) => {
    setEntries((e) => e.filter((x) => x.pose_id !== poseId));
  };

  const setDuration = (poseId: string, min: number) => {
    const v = Math.min(10, Math.max(1, min));
    setEntries((list) => list.map((e) => (e.pose_id === poseId ? { ...e, duration_min: v } : e)));
  };

  const handleSave = async () => {
    if (!title.trim() || entries.length === 0) return;
    try {
      await createPlan.mutateAsync({
        title: title.trim(),
        exercises: entries.map((e) => ({ pose_id: e.pose_id, duration_min: e.duration_min })),
      });
      toast.success(t.planSavedToast);
      router.push("/plans");
    } catch {
      toast.error(t.loadError);
    }
  };

  const nameOf = (pid: string) => {
    const p = poseMap[pid];
    if (!p) return pid;
    return locale === "tr" ? p.name_tr : p.name_en;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link href="/explore" className="mb-6 inline-flex text-sm font-medium text-sage-600 hover:underline dark:text-sage-400">
        ← {t.back}
      </Link>

      <h1 className="text-2xl font-bold text-th-text">{t.customPlanPageTitle}</h1>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-th-text">{t.trainingNameLabel}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field w-full" />
      </label>

      {injuryOverlap.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">{t.injuryWarningTitle}</p>
          <p className="mt-1 text-xs">{t.injuryWarningDesc}</p>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-th-text">
            {t.selectedPosesTitle} ({entries.length})
          </h2>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-secondary text-sm">
            {t.addPose}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-th-border py-10 text-center text-sm text-th-text-mut">{t.noPoses}</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const p = poseMap[e.pose_id];
              const border = p ? categoryBorder(p.category) : colors.primary;
              return (
                <li key={e.pose_id} className="flex flex-col gap-3 rounded-xl border border-th-border bg-th-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: border }} />
                    <div>
                      <p className="font-medium text-th-text">{nameOf(e.pose_id)}</p>
                      <p className="text-xs text-th-text-mut">{p ? catLabel(p.category, t) : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={e.duration_min}
                      onChange={(ev) => setDuration(e.pose_id, Number(ev.target.value))}
                      className="input-field py-2 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {t.minutesShort}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeEntry(e.pose_id)} className="rounded-lg p-2 text-th-text-mut hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-th-border bg-th-subtle p-4 text-sm text-th-text-sec">
        <p>
          {t.totalDuration}: {totalMin} {t.minutesShort}
        </p>
        <p className="mt-1">
          {t.poseCount}: {entries.length}
        </p>
        <p className="mt-1">
          {t.analyzableCount}: {analyzable}/{Math.max(entries.length, 1)}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={createPlan.isPending || !title.trim() || entries.length === 0}
        className="btn-primary mt-8 w-full justify-center disabled:opacity-50"
      >
        {createPlan.isPending ? <LoadingSpinner size="sm" /> : t.savePlan}
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={() => setModalOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-th-border bg-th-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-th-border px-4 py-3">
              <h3 className="font-semibold text-th-text">{t.selectPoses}</h3>
              <input value={mq} onChange={(e) => setMq(e.target.value)} placeholder={t.searchPoses} className="input-field mt-3 w-full text-sm" />
              <select value={mcat} onChange={(e) => setMcat(e.target.value)} className="input-field mt-2 w-full text-sm">
                <option value="">{t.categoryAll}</option>
                {Array.from(new Set(poses.map((p) => p.category)))
                  .sort()
                  .map((c) => (
                    <option key={c} value={c}>
                      {catLabel(c, t)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="max-h-[45vh] overflow-y-auto px-2 py-2">
              {isLoading ? (
                <LoadingSpinner size="md" />
              ) : (
                modalFiltered.map((p) => {
                  const checked = selectedIds.has(p.pose_id);
                  const disabled = entries.some((e) => e.pose_id === p.pose_id);
                  return (
                    <button
                      key={p.pose_id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSel(p.pose_id)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                        disabled ? "opacity-40" : checked ? "bg-sage-400/15" : "hover:bg-th-subtle"
                      }`}
                    >
                      <span className="mt-0.5">{checked ? "☑" : "☐"}</span>
                      <span>
                        <span className="font-medium text-th-text">{locale === "tr" ? p.name_tr : p.name_en}</span>
                        <span className="ml-2 text-xs text-th-text-mut">{catLabel(p.category, t)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between border-t border-th-border px-4 py-3">
              <span className="text-xs text-th-text-mut">
                {selectedIds.size} {t.posesSelected}
              </span>
              <button type="button" onClick={addSelected} disabled={selectedIds.size === 0} className="btn-primary text-sm disabled:opacity-50">
                {t.addSelectedPoses}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
