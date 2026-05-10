"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTrainingSessions, useTrainingStats, useDeleteSession } from "@/hooks/useTraining";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import type { TrainingSession } from "@/types/yoga";

function accuracyBorder(acc: number): string {
  if (acc >= 80) return "border-l-green-500";
  if (acc >= 50) return "border-l-amber-500";
  return "border-l-red-500";
}

export default function TrainingListPage() {
  const { t, locale } = useApp();
  const { data: sessions = [], isLoading, error, refetch, isError } = useTrainingSessions();
  const { data: stats } = useTrainingStats();
  const deleteMut = useDeleteSession();
  const [delId, setDelId] = useState<string | null>(null);

  const hours = stats ? (stats.total_duration_sec / 3600).toFixed(1) : "0";

  const sorted = [...sessions].sort((a, b) => {
    const ta = new Date(a.started_at).getTime();
    const tb = new Date(b.started_at).getTime();
    return tb - ta;
  });

  const handleDelete = async () => {
    if (!delId) return;
    try {
      await deleteMut.mutateAsync(delId);
      setDelId(null);
    } catch {
      setDelId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-th-text">{t.trainingOverview}</h1>
        <p className="mt-1 text-sm text-th-text-mut">{t.trainingSubtitle}</p>
      </div>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-sage-400/90 via-sage-500/85 to-clay-400/90 p-6 text-white shadow-lg md:p-8">
        <p className="text-lg font-semibold leading-relaxed">
          {stats?.total_sessions ?? 0} {t.statsSessions} · {hours} {t.statsHoursWord} · %
          {Math.round(stats?.average_accuracy ?? 0)} {t.statsAvgShort}
        </p>
        <p className="mt-2 text-sm text-white/90">
          {stats?.current_streak ?? 0} {t.streakDays}
        </p>
      </div>

      {isError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {t.loadError}{" "}
          <button type="button" className="font-medium underline" onClick={() => refetch()}>
            {t.reload}
          </button>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-th-text">{t.pastSessions}</h2>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-th-border py-16 text-center text-th-text-mut">{t.noTrainings}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sorted.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              locale={locale}
              accuracyBorder={accuracyBorder}
              onRequestDelete={() => setDelId(s.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!delId}
        title={t.deleteTraining}
        description={t.deleteTrainingDesc}
        confirmLabel={t.deleteTxt}
        cancelLabel={t.back}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}

function SessionRow({
  session,
  locale,
  accuracyBorder,
  onRequestDelete,
}: {
  session: TrainingSession;
  locale: string;
  accuracyBorder: (n: number) => string;
  onRequestDelete: () => void;
}) {
  const { t } = useApp();
  const title = session.plan_title || t.sessionUntitled;
  const dt = new Date(session.started_at).toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const acc = session.average_accuracy ?? 0;
  const durMin = Math.round((session.total_duration_sec || 0) / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border border-th-border bg-th-card shadow-sm ${accuracyBorder(acc)} border-l-4`}
    >
      <div className="flex">
        <Link href={`/training/${session.id}`} className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-th-text">{title}</p>
              <p className="mt-1 text-xs text-th-text-mut">{dt}</p>
              <p className="mt-2 text-sm text-th-text-sec">
                {durMin}
                {t.minutesShort} · {session.pose_count ?? 0} {t.sessionCardPoses}
              </p>
            </div>
            <span className="shrink-0 text-lg font-bold text-sage-600 dark:text-sage-400">%{Math.round(acc)}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-th-muted">
            <div
              className={`h-full rounded-full ${acc >= 80 ? "bg-green-500" : acc >= 50 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, Math.round(acc))}%` }}
            />
          </div>
        </Link>
        <button
          type="button"
          onClick={onRequestDelete}
          className="shrink-0 border-l border-th-border px-3 text-th-text-mut hover:bg-th-subtle hover:text-red-500"
          aria-label={t.deleteTxt}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
