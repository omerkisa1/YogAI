"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePlans } from "@/hooks/usePlans";
import { useTrainingSessions, useTrainingStats } from "@/hooks/useTraining";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useApp } from "@/components/layout/AppProvider";
import PlanCard from "@/components/yoga/PlanCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { TrainingSession } from "@/types/yoga";
import { Calendar, Clock, Flame, Timer } from "lucide-react";
import { accuracyProgressBarClass, accuracyScoreTextClass } from "@/lib/trainingAccuracy";

function RecentSessionCard({
  session,
  locale,
}: {
  session: TrainingSession;
  locale: string;
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
  const accRounded = Math.round(acc);
  const durMin = Math.round((session.total_duration_sec || 0) / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group ring-1 ring-transparent transition-all duration-200 hover:ring-sage-300/40 hover:shadow-md dark:hover:ring-sage-600/30"
    >
      <Link href={`/training/${session.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-base font-semibold leading-snug text-th-text">{title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-th-text-mut">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {dt}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {durMin}
                {t.minutesShort}
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {session.pose_count ?? 0} {t.sessionCardPoses}
              </span>
            </div>
          </div>
          <span
            className={`shrink-0 text-2xl font-bold tabular-nums tracking-tight ${accuracyScoreTextClass(acc)}`}
          >
            %{accRounded}
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-th-muted">
          <div
            className={`h-full rounded-full ${accuracyProgressBarClass(acc)}`}
            style={{ width: `${Math.min(100, accRounded)}%` }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { t, locale } = useApp();
  const { plans, loading: plansLoading, refetch } = usePlans();
  const { data: sessions = [], isLoading: sessionsLoading } = useTrainingSessions();
  const { data: stats, isLoading: statsLoading } = useTrainingStats();

  const hours = stats ? (stats.total_duration_sec / 3600).toFixed(1) : "0";
  const sortedSessions = [...sessions].sort((a, b) => {
    const ta = new Date(a.started_at).getTime();
    const tb = new Date(b.started_at).getTime();
    return tb - ta;
  });
  const recentPlans = plans.slice(0, 3);
  const recentSessions = sortedSessions.slice(0, 3);

  const showPlansSkeleton = plansLoading && plans.length === 0;
  const showSessionsSkeleton = sessionsLoading && sessions.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-th-text">
          {t.welcomeBackUser}
          {user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
      </motion.div>

      <section className="mb-10" aria-label={t.planQuickStartTitle}>
        <h2 className="mb-4 text-lg font-semibold text-th-text">{t.planQuickStartTitle}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/create-plan?level=beginner&duration=15&focus_area=full_body"
            className="rounded-2xl border border-th-border bg-th-card p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-semibold text-th-text">{t.beginner}</p>
            <p className="mt-1 text-sm text-th-text-sec">{t.planPresetBeginnerSub}</p>
          </Link>
          <Link
            href="/create-plan?level=intermediate&duration=25&focus_area=balance"
            className="rounded-2xl border border-th-border bg-th-card p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-semibold text-th-text">{t.intermediate}</p>
            <p className="mt-1 text-sm text-th-text-sec">{t.planPresetIntermediateSub}</p>
          </Link>
          <Link
            href="/create-plan?level=advanced&duration=35&focus_area=full_body"
            className="rounded-2xl border border-th-border bg-th-card p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-semibold text-th-text">{t.advanced}</p>
            <p className="mt-1 text-sm text-th-text-sec">{t.planPresetAdvancedSub}</p>
          </Link>
        </div>
      </section>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-sage-400/90 via-sage-500/85 to-clay-400/90 p-6 text-white shadow-lg md:p-8">
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold leading-relaxed">
              {stats?.total_sessions ?? 0} {t.statsSessions} · {hours} {t.statsHoursWord} · %
              {Math.round(stats?.average_accuracy ?? 0)} {t.statsAvgShort}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
              <Flame className="h-4 w-4 shrink-0 text-amber-200" strokeWidth={2} aria-hidden />
              {stats?.current_streak ?? 0} {t.streakDays}
            </p>
          </>
        )}
      </div>

      <div className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-th-text">{t.recentPlans}</h2>
          <Link href="/plans" className="text-sm font-medium text-sage-600 hover:underline dark:text-sage-400">
            {t.viewAllPlans}
          </Link>
        </div>
        {showPlansSkeleton ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : recentPlans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-th-border py-12 text-center text-sm text-th-text-mut">
            {t.noPlans}{" "}
            <Link href="/create-plan" className="font-medium text-sage-600 underline dark:text-sage-400">
              {t.createFirstBtn}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                onUpdated={() => refetch()}
                detailHref={`/plans/${plan.id}`}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-th-text">{t.recentTrainings}</h2>
          <Link href="/training" className="text-sm font-medium text-sage-600 hover:underline dark:text-sage-400">
            {t.viewAllTrainings}
          </Link>
        </div>
        {showSessionsSkeleton ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-th-border py-12 text-center text-sm text-th-text-mut">{t.noTrainings}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSessions.map((s) => (
              <RecentSessionCard key={s.id} session={s} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
