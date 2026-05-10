"use client";

import { useParams } from "next/navigation";
import { useTrainingSession, useStartSession } from "@/hooks/useTraining";
import { useAllPoses } from "@/hooks/usePoses";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import BackLink from "@/components/shared/BackLink";

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-th-text-mut">{t.loadError}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
          {t.reload}
        </button>
        <div className="mt-4 flex justify-center">
          <BackLink href="/training">{t.trainingHistory}</BackLink>
        </div>
      </div>
    );
  }

  const dt = new Date(session.started_at).toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = session.plan_title || t.sessionUntitled;
  const results = session.results ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <BackLink href="/training" className="mb-6">
        {t.back}
      </BackLink>

      <h1 className="text-xl font-bold text-th-text md:text-2xl">{t.trainingDetail}</h1>

      <div className="mt-6 rounded-2xl border border-th-border bg-th-card p-5">
        <p className="text-lg font-semibold text-th-text">{title}</p>
        <p className="mt-1 text-sm text-th-text-mut">{dt}</p>
        <p className="mt-4 text-sm font-medium text-th-text">
          {t.averageScore}: %{Math.round(session.average_accuracy ?? 0)}
        </p>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-th-text">{t.trainingResults}</h2>
      <ul className="space-y-3">
        {results.map((r, i) => {
          const nm = nameMap[r.pose_id] || r.pose_id;
          const pct = Math.round(r.accuracy ?? 0);
          return (
            <li key={`${r.pose_id}-${i}`} className="rounded-xl border border-th-border bg-th-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-th-text">
                  {i + 1}. {nm}
                </span>
                <span className="text-sm font-bold text-sage-600 dark:text-sage-400">%{pct}</span>
              </div>
              <p className="mt-1 text-xs text-th-text-mut">
                {r.duration_seconds} {t.secondsShort}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-th-muted">
                <div
                  className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleRetry}
        disabled={startSession.isPending || !session.plan_id}
        className="btn-secondary mt-8 w-full justify-center md:w-auto"
      >
        {startSession.isPending ? <LoadingSpinner size="sm" /> : t.retryTraining}
      </button>
    </div>
  );
}
