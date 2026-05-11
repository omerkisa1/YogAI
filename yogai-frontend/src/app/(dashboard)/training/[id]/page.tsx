"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowRight, Calendar, CheckCircle2, Clock, Timer } from "lucide-react";
import { useTrainingSession, useStartSession } from "@/hooks/useTraining";
import { useAllPoses } from "@/hooks/usePoses";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import BackLink from "@/components/shared/BackLink";
import { accuracyProgressBarClass, accuracyScoreTextClass, formatDurationSeconds } from "@/lib/trainingAccuracy";
import { trainingSessionStatusLabel } from "@/lib/trainingSessionLabels";
import type { PoseResult } from "@/types/yoga";

function poseInsight(results: PoseResult[], nameMap: Record<string, string>) {
  if (results.length === 0) return null;
  let best = results[0];
  let worst = results[0];
  for (const r of results) {
    const a = r.accuracy ?? 0;
    if (a > (best.accuracy ?? 0)) best = r;
    if (a < (worst.accuracy ?? 0)) worst = r;
  }
  const sumTime = results.reduce((s, r) => s + (r.duration_seconds || 0), 0);
  const avgFromPoses = results.reduce((s, r) => s + (r.accuracy ?? 0), 0) / results.length;
  return {
    best,
    worst,
    sumTime,
    avgFromPoses,
    bestName: nameMap[best.pose_id] || best.pose_id,
    worstName: nameMap[worst.pose_id] || worst.pose_id,
  };
}

export default function TrainingDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { t, locale } = useApp();
  const { data: session, isLoading, error, refetch } = useTrainingSession(id);
  const { data: poses = [] } = useAllPoses();
  const startSession = useStartSession();

  const nameMap = Object.fromEntries(poses.map((p) => [p.pose_id, locale === "tr" ? p.name_tr : p.name_en]));

  const handleRetry = async () => {
    if (!session?.plan_id) return;
    try {
      const res = await startSession.mutateAsync(session.plan_id);
      window.location.href = `/training/session?planId=${encodeURIComponent(session.plan_id)}&sessionId=${encodeURIComponent(res.session_id)}`;
    } catch {
      toast.error(t.loadError);
    }
  };

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-start px-4 py-16 sm:px-6 lg:px-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="w-full px-4 py-16 text-left sm:px-6 lg:px-10">
        <p className="max-w-lg text-th-text-mut">{t.loadError}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
          {t.reload}
        </button>
        <div className="mt-6">
          <BackLink href="/training">{t.trainingHistory}</BackLink>
        </div>
      </div>
    );
  }

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

  const title = session.plan_title || t.sessionUntitled;
  const results = session.results ?? [];
  const avg = session.average_accuracy ?? 0;
  const avgRounded = Math.round(avg);
  const totalSec = session.total_duration_sec || 0;
  const durLabel = formatDurationSeconds(totalSec, t.minutesShort, t.secondsShort);
  const insight = poseInsight(results, nameMap);
  const statusLabel = trainingSessionStatusLabel(session.status, t);

  return (
    <div className="w-full px-4 py-8 text-left sm:px-6 lg:px-10 lg:py-10 xl:pr-12">
      <BackLink href="/training" className="mb-8">
        {t.back}
      </BackLink>

      <h1 className="text-3xl font-bold tracking-tight text-th-text md:text-4xl">{t.trainingDetail}</h1>

      <div className="card mt-10 p-6 md:p-10 lg:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-th-border bg-th-subtle px-3 py-1 text-xs font-medium text-th-text-sec">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                {statusLabel}
              </span>
              {session.plan_id ? (
                <Link
                  href={`/plans/${session.plan_id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-sage-600 hover:underline dark:text-sage-400"
                >
                  {t.openPlanLink}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
            <h2 className="text-2xl font-semibold leading-tight text-th-text md:text-3xl lg:text-4xl">{title}</h2>
            <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex gap-3">
                <Calendar className="mt-1 h-5 w-5 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionStartedLabel}</dt>
                  <dd className="mt-1 text-base text-th-text">{dt}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionCompletedLabel}</dt>
                  <dd className="mt-1 text-base text-th-text">{completedAt ?? "—"}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.totalDuration}</dt>
                  <dd className="mt-1 text-base text-th-text">{durLabel}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Timer className="mt-1 h-5 w-5 shrink-0 text-th-text-mut" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionCardPoses}</dt>
                  <dd className="mt-1 text-base text-th-text">
                    {session.pose_count ?? 0} {t.sessionCardPoses}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="flex w-full shrink-0 flex-col items-stretch gap-4 border-t border-th-border pt-8 lg:w-auto lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div
              className={`flex min-h-[10rem] min-w-[min(100%,12rem)] flex-col items-center justify-center rounded-3xl bg-th-subtle px-8 py-8 lg:min-w-[14rem] ${accuracyScoreTextClass(avg)}`}
            >
              <span className="text-5xl font-bold tabular-nums leading-none md:text-6xl">%{avgRounded}</span>
              <span className="mt-3 text-center text-sm font-medium text-th-text-mut">{t.averageScore}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-th-muted lg:max-w-xs">
              <div
                className={`h-full rounded-full ${accuracyProgressBarClass(avg)}`}
                style={{ width: `${Math.min(100, avgRounded)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-th-border pt-8 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleRetry}
            disabled={startSession.isPending || !session.plan_id}
            className="btn-primary justify-center px-10 py-3.5 text-base disabled:opacity-50 sm:min-w-[220px]"
          >
            {startSession.isPending ? <LoadingSpinner size="sm" /> : t.retryTraining}
          </button>
          {session.plan_id ? (
            <Link href={`/plans/${session.plan_id}`} className="btn-secondary justify-center px-10 py-3.5 text-base sm:min-w-[200px]">
              {t.openPlanLink}
            </Link>
          ) : null}
        </div>
      </div>

      {insight ? (
        <section className="mt-10" aria-labelledby="session-insights-heading">
          <h2 id="session-insights-heading" className="text-xl font-semibold text-th-text md:text-2xl">
            {t.sessionInsightHeading}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-th-border bg-th-card px-5 py-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.sessionPoseTimeSum}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-th-text">
                {formatDurationSeconds(insight.sumTime, t.minutesShort, t.secondsShort)}
              </p>
            </div>
            <div className="rounded-2xl border border-th-border bg-th-card px-5 py-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.statsAvgShort}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-th-text">%{Math.round(insight.avgFromPoses)}</p>
              <p className="mt-1 text-xs text-th-text-mut">{t.trainingResults}</p>
            </div>
            <div className="rounded-2xl border border-th-border bg-th-card px-5 py-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.bestPoseResult}</p>
              <p className="mt-2 line-clamp-2 text-base font-semibold text-th-text">{insight.bestName}</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${accuracyScoreTextClass(insight.best.accuracy ?? 0)}`}>
                %{Math.round(insight.best.accuracy ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-th-border bg-th-card px-5 py-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-th-text-mut">{t.lowestPoseResult}</p>
              <p className="mt-2 line-clamp-2 text-base font-semibold text-th-text">{insight.worstName}</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${accuracyScoreTextClass(insight.worst.accuracy ?? 0)}`}>
                %{Math.round(insight.worst.accuracy ?? 0)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="pose-results-heading">
        <h2 id="pose-results-heading" className="text-xl font-semibold text-th-text md:text-2xl">
          {t.trainingResults}
        </h2>

        {results.length === 0 ? (
          <div className="mt-5 max-w-3xl rounded-2xl border border-dashed border-th-border bg-th-card/60 px-6 py-14 text-th-text-mut">
            {t.noPoses}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-th-border bg-th-card shadow-sm">
            <div className="hidden border-b border-th-border bg-th-subtle/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-th-text-mut md:grid md:grid-cols-12 md:gap-4">
              <div className="col-span-1">#</div>
              <div className="col-span-5">{t.posesLabel}</div>
              <div className="col-span-2">{t.durationLabel}</div>
              <div className="col-span-2 text-right">{t.poseTestAccuracyLabel}</div>
              <div className="col-span-2">{t.poseCompletedAtLabel}</div>
            </div>
            <ol className="divide-y divide-th-border">
              {results.map((r, i) => {
                const nm = nameMap[r.pose_id] || r.pose_id;
                const pct = Math.round(r.accuracy ?? 0);
                const dur = formatDurationSeconds(r.duration_seconds || 0, t.minutesShort, t.secondsShort);
                const done = r.completed_at
                  ? new Date(r.completed_at).toLocaleString(loc, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";
                return (
                  <li key={`${r.pose_id}-${i}`} className="px-5 py-6 md:px-6 md:py-5">
                    <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:items-center md:gap-x-4 md:gap-y-3">
                      <div className="flex items-center justify-between gap-3 md:col-span-1 md:justify-start">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-th-subtle text-sm font-bold text-th-text-sec">
                          {i + 1}
                        </span>
                        <span className={`text-2xl font-bold tabular-nums md:hidden ${accuracyScoreTextClass(pct)}`}>
                          %{pct}
                        </span>
                      </div>
                      <div className="min-w-0 md:col-span-5">
                        <p className="text-lg font-semibold leading-snug text-th-text">{nm}</p>
                        <p className="mt-1 text-sm text-th-text-mut md:hidden">
                          {t.durationLabel}: {dur} · {t.poseCompletedAtLabel}: {done}
                        </p>
                      </div>
                      <p className="hidden text-base tabular-nums text-th-text md:col-span-2 md:block">{dur}</p>
                      <p className={`hidden text-right text-lg font-bold tabular-nums md:col-span-2 md:block ${accuracyScoreTextClass(pct)}`}>
                        %{pct}
                      </p>
                      <p className="hidden text-sm text-th-text-mut md:col-span-2 md:block">{done}</p>
                      <div className="md:col-span-12">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-th-muted">
                          <div
                            className={`h-full rounded-full ${accuracyProgressBarClass(pct)}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
