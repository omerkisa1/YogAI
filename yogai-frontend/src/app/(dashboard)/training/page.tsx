"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Calendar, CheckCircle2, Clock, Flame, Trash2, Timer } from "lucide-react";
import { useTrainingSessions, useTrainingStats, useDeleteSession } from "@/hooks/useTraining";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import type { TrainingSession } from "@/types/yoga";
import { accuracyProgressBarClass, accuracyScoreTextClass, formatDurationSeconds } from "@/lib/trainingAccuracy";
import { trainingSessionStatusLabel } from "@/lib/trainingSessionLabels";

export default function TrainingListPage() {
  const { t, locale } = useApp();
  const { data: sessions = [], isLoading, refetch, isError } = useTrainingSessions();
  const { data: stats } = useTrainingStats();
  const deleteMut = useDeleteSession();
  const [delId, setDelId] = useState<string | null>(null);

  const hours = stats ? (stats.total_duration_sec / 3600).toFixed(1) : "0";
  const avgAcc = Math.round(stats?.average_accuracy ?? 0);
  const totalSessions = stats?.total_sessions ?? 0;
  const streak = stats?.current_streak ?? 0;

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
    <div className="w-full px-4 py-8 text-left sm:px-6 lg:px-10 lg:py-10 xl:pr-12">
      <header className="mb-10 max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-th-text md:text-4xl">{t.trainingOverview}</h1>
        <p className="mt-2 max-w-3xl text-base text-th-text-mut">{t.trainingSubtitle}</p>
      </header>

      <section
        className="card mb-12 grid grid-cols-2 gap-8 p-8 md:grid-cols-4 md:gap-10 md:p-10"
        aria-label={t.trainingSubtitle}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.statsSessions}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-th-text md:text-4xl">{totalSessions}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.statsHoursWord}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-th-text md:text-4xl">{hours}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.statsAvgShort}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-th-text md:text-4xl">%{avgAcc}</p>
        </div>
        <div className="col-span-2 flex flex-col justify-end border-t border-th-border pt-6 md:col-span-1 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.streakDays}</p>
          <p className="mt-3 flex items-center gap-2 text-3xl font-semibold tabular-nums text-th-text md:text-4xl">
            <Flame className="h-8 w-8 shrink-0 text-sage-500" strokeWidth={2} aria-hidden />
            {streak}
          </p>
        </div>
      </section>

      {isError && (
        <div className="mb-8 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {t.loadError}{" "}
          <button type="button" className="font-medium underline" onClick={() => refetch()}>
            {t.reload}
          </button>
        </div>
      )}

      <h2 className="mb-6 text-xl font-semibold text-th-text md:text-2xl">{t.pastSessions}</h2>

      {isLoading ? (
        <div className="flex justify-start py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="max-w-3xl rounded-2xl border border-dashed border-th-border bg-th-card/60 px-6 py-16 text-left text-th-text-mut">
          {t.noTrainings}
        </div>
      ) : (
        <ul className="flex w-full max-w-none flex-col gap-5" role="list">
          {sorted.map((s) => (
            <li key={s.id} className="w-full">
              <SessionRow session={s} locale={locale} onRequestDelete={() => setDelId(s.id)} />
            </li>
          ))}
        </ul>
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
  onRequestDelete,
}: {
  session: TrainingSession;
  locale: string;
  onRequestDelete: () => void;
}) {
  const { t } = useApp();
  const title = session.plan_title || t.sessionUntitled;
  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const dt = new Date(session.started_at).toLocaleString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const completedAt = session.completed_at
    ? new Date(session.completed_at).toLocaleString(loc, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const acc = session.average_accuracy ?? 0;
  const accRounded = Math.round(acc);
  const totalSec = session.total_duration_sec || 0;
  const durLabel = formatDurationSeconds(totalSec, t.minutesShort, t.secondsShort);
  const statusLabel = trainingSessionStatusLabel(session.status, t);
  const results = session.results ?? [];
  const recordedPoseTime = results.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const recordedLabel =
    results.length > 0
      ? formatDurationSeconds(recordedPoseTime, t.minutesShort, t.secondsShort)
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group relative flex w-full max-w-none flex-col overflow-hidden p-0 ring-1 ring-transparent transition-all duration-200 hover:ring-sage-300/40 hover:shadow-md dark:hover:ring-sage-600/30 md:flex-row"
    >
      <Link
        href={`/training/${session.id}`}
        className="min-w-0 flex-1 p-6 pb-5 md:p-8 md:pr-6 lg:p-10"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-th-border bg-th-subtle px-3 py-1 text-xs font-medium text-th-text-sec">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                {statusLabel}
              </span>
              {results.length > 0 ? (
                <span className="text-xs text-th-text-mut md:text-sm">
                  {results.length}/{session.pose_count ?? 0} {t.posesLabel} · {t.sessionPoseTimeSum}: {recordedLabel}
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-semibold leading-snug text-th-text md:text-2xl">{title}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex gap-2 text-sm">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionStartedLabel}</p>
                  <p className="mt-0.5 text-th-text">{dt}</p>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionCompletedLabel}</p>
                  <p className="mt-0.5 text-th-text">{completedAt ?? "—"}</p>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.totalDuration}</p>
                  <p className="mt-0.5 text-th-text">{durLabel}</p>
                </div>
              </div>
              <div className="flex gap-2 text-sm sm:col-span-2 lg:col-span-1">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionCardPoses}</p>
                  <p className="mt-0.5 text-th-text">
                    {session.pose_count ?? 0} {t.sessionCardPoses}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <span
              className={`text-4xl font-bold tabular-nums tracking-tight md:text-5xl ${accuracyScoreTextClass(acc)}`}
            >
              %{accRounded}
            </span>
            <span className="max-w-[14rem] text-right text-xs text-th-text-mut sm:text-sm">{t.averageScore}</span>
          </div>
        </div>
        <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-th-muted md:mt-8">
          <div
            className={`h-full rounded-full ${accuracyProgressBarClass(acc)}`}
            style={{ width: `${Math.min(100, accRounded)}%` }}
          />
        </div>
      </Link>

      <div
        className={`flex shrink-0 items-stretch justify-end gap-0 border-t border-th-border bg-th-subtle/50 md:flex-col md:border-l md:border-t-0 md:bg-transparent ${session.plan_id ? "md:w-44" : "md:w-14"}`}
      >
        {session.plan_id ? (
          <Link
            href={`/plans/${session.plan_id}`}
            className="flex flex-1 items-center justify-center px-4 py-3 text-center text-sm font-medium text-sage-600 transition-colors hover:bg-th-subtle hover:underline dark:text-sage-400 md:flex-1 md:py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {t.openPlanLink}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onRequestDelete}
          className="flex items-center justify-center border-l border-th-border px-5 py-3 text-th-text-mut transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 md:border-l-0 md:border-t md:px-4 md:py-4"
          aria-label={t.deleteTxt}
        >
          <Trash2 className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
