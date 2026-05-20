"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PersonStanding,
  Video,
  X,
} from "lucide-react";
import { usePlan } from "@/hooks/usePlans";
import { usePose } from "@/hooks/usePoses";
import { useSubmitPose, useCompleteSession } from "@/hooks/useTraining";
import { useApp } from "@/components/layout/AppProvider";
import { exerciseAllocatedSeconds, getLocalizedPlanSafe } from "@/lib/planHelpers";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { PoseCameraStage } from "@/components/training/PoseCameraStage";
import {
  useMediapipePoseCamera,
  type MediapipeLandmarkFrame,
} from "@/hooks/useMediapipePoseCamera";
import {
  analyzePoseClientSide,
  type AnalyzeResult,
  type LandmarkRule,
} from "@/lib/poseAnalyzer";
import {
  accuracyAccent,
  accuracyTextClass,
  ruleOverlayClass,
} from "@/lib/poseTestCameraTheme";
import { aggregateAccuracyFromSamples } from "@/lib/trainingAccuracy";
import {
  useExerciseAnalysis,
  resolveExerciseAnalysisKind,
} from "@/hooks/useExerciseAnalysis";
import { FaceTrainingOverlays } from "@/components/training/FaceTrainingOverlays";

const FIXED_ACCURACY = 75;
const DEV_TIMER = process.env.NODE_ENV === "development";

type CamPermission = "idle" | "checking" | "granted" | "denied";

function TrainingSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const { t, locale } = useApp();

  const { data: plan, isLoading: planLoading } = usePlan(planId);
  const submitPose = useSubmitPose();
  const completeSession = useCompleteSession();

  const detail = useMemo(
    () => (plan ? getLocalizedPlanSafe(plan, locale, t.yogaPlan) : null),
    [plan, locale, t.yogaPlan],
  );

  const exercises = detail?.exercises ?? [];
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [poseElapsed, setPoseElapsed] = useState(0);
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const autoKeyRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [camPermission, setCamPermission] = useState<CamPermission>("idle");
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [lastAnalyzeResult, setLastAnalyzeResult] = useState<AnalyzeResult | null>(
    null,
  );
  const [visibilityWarning, setVisibilityWarning] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [modelPipelineError, setModelPipelineError] = useState(false);
  const [pipelineRetryKey, setPipelineRetryKey] = useState(0);

  const accuracySamplesRef = useRef<number[]>([]);
  const rulesRef = useRef<LandmarkRule[]>([]);
  const poseIdRef = useRef<string>("");

  const cameraStageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const current = exercises[index];
  const next = exercises[index + 1];
  const allocated = current ? exerciseAllocatedSeconds(current, DEV_TIMER) : 0;
  const isRepMetric = current?.metric_type === "reps";

  const analyzablePoseId =
    current?.is_analyzable && current.pose_id ? current.pose_id : "";
  const poseRulesQuery = usePose(analyzablePoseId);
  const poseRulesLoading = !!analyzablePoseId && poseRulesQuery.isLoading;
  const poseRulesError = !!analyzablePoseId && poseRulesQuery.isError;
  const rules = useMemo(
    () => (poseRulesQuery.data?.landmark_rules ?? []) as LandmarkRule[],
    [poseRulesQuery.data?.landmark_rules],
  );

  const analysisKind = useMemo(
    () =>
      analyzablePoseId
        ? resolveExerciseAnalysisKind(
            analyzablePoseId,
            poseRulesQuery.data?.analysis_kind,
          )
        : "body",
    [analyzablePoseId, poseRulesQuery.data?.analysis_kind],
  );
  const isBodyAnalyzable =
    !!current?.is_analyzable && analysisKind === "body";
  const isFaceAnalyzable =
    !!current?.is_analyzable && (analysisKind === "face" || analysisKind === "face_hand");

  const faceAnalysis = useExerciseAnalysis({
    poseId: analyzablePoseId,
    analysisKind,
    repTarget: current?.rep_target || poseRulesQuery.data?.rep_target,
    active: phase === "run" && isFaceAnalyzable && camPermission !== "denied",
    videoRef,
  });

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    poseIdRef.current = analyzablePoseId;
  }, [analyzablePoseId]);

  useEffect(() => {
    accuracySamplesRef.current = [];
    setLiveAccuracy(null);
    setLastAnalyzeResult(null);
    setVisibilityWarning(false);
    setRulesOpen(false);
    setModelPipelineError(false);
  }, [index]);

  useEffect(() => {
    if (phase !== "run" || !current?.is_analyzable) {
      setCamPermission("idle");
      return;
    }
    if (isFaceAnalyzable) {
      setCamPermission("checking");
      return;
    }
    let cancelled = false;
    setCamPermission("checking");
    void (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (!cancelled) setCamPermission("granted");
      } catch {
        if (!cancelled) setCamPermission("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current?.pose_id, index, phase, current?.is_analyzable, isFaceAnalyzable]);

  useEffect(() => {
    if (!isFaceAnalyzable || phase !== "run") return;
    if (faceAnalysis.cameraReady && !faceAnalysis.pipelineError) {
      setCamPermission("granted");
    }
    if (faceAnalysis.pipelineError) {
      setCamPermission("denied");
    }
  }, [
    isFaceAnalyzable,
    phase,
    faceAnalysis.cameraReady,
    faceAnalysis.pipelineError,
  ]);

  const resolveSubmittedAccuracy = useCallback(() => {
    if (!current?.is_analyzable) return FIXED_ACCURACY;
    if (isFaceAnalyzable) {
      if (faceAnalysis.isRepComplete) return 100;
      const acc = faceAnalysis.repAccuracy();
      return acc > 0 ? acc : FIXED_ACCURACY;
    }
    return aggregateAccuracyFromSamples(accuracySamplesRef.current, FIXED_ACCURACY);
  }, [current?.is_analyzable, isFaceAnalyzable, faceAnalysis]);

  const handleLandmarkFrame = useCallback((frame: MediapipeLandmarkFrame) => {
    const { landmarks } = frame;
    if (!landmarks) {
      setVisibilityWarning(true);
      setLastAnalyzeResult(null);
      setLiveAccuracy(null);
      return;
    }
    if (rulesRef.current.length === 0) return;
    const mapped = landmarks.map((lm, idx) => ({
      index: idx,
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 0,
    }));
    const result = analyzePoseClientSide(
      poseIdRef.current,
      rulesRef.current,
      mapped,
    );
    if (result === null) {
      setVisibilityWarning(true);
      setLastAnalyzeResult(null);
      setLiveAccuracy(null);
      return;
    }
    setVisibilityWarning(false);
    accuracySamplesRef.current.push(result.overall_accuracy);
    setLiveAccuracy(result.overall_accuracy);
    setLastAnalyzeResult(result);
  }, []);

  const handleModelError = useCallback(() => {
    setModelPipelineError(true);
  }, []);

  const rulesReady = rules.length > 0;
  const mediapipeActive =
    phase === "run" &&
    isBodyAnalyzable &&
    camPermission === "granted" &&
    !poseRulesLoading &&
    rulesReady &&
    !poseRulesError &&
    !modelPipelineError;

  const facePipelineReady =
    isFaceAnalyzable &&
    camPermission === "granted" &&
    !poseRulesLoading &&
    !poseRulesError &&
    faceAnalysis.cameraReady &&
    !faceAnalysis.pipelineLoading &&
    !faceAnalysis.pipelineError;

  const { fps } = useMediapipePoseCamera({
    active: mediapipeActive,
    containerRef: cameraStageRef,
    videoRef,
    canvasRef,
    modelComplexity: 0,
    restartKey: `${index}-${analyzablePoseId}-${pipelineRetryKey}`,
    onFrame: handleLandmarkFrame,
    onModelLoadError: handleModelError,
  });

  const retryCamera = useCallback(async () => {
    setCamPermission("checking");
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCamPermission("granted");
    } catch {
      setCamPermission("denied");
    }
  }, []);

  const retryModel = useCallback(() => {
    setModelPipelineError(false);
    setPipelineRetryKey((k) => k + 1);
  }, []);

  const finishWorkout = useCallback(async () => {
    try {
      await completeSession.mutateAsync(sessionId);
      setPhase("done");
    } catch {
      router.push("/training");
    }
  }, [completeSession, sessionId, router]);

  const goNextOrFinish = useCallback(
    async (accuracy: number, durationSeconds: number) => {
      if (!current) return;
      try {
        await submitPose.mutateAsync({
          sessionId,
          data: {
            pose_id: current.pose_id,
            accuracy,
            duration_seconds: durationSeconds,
          },
        });
        setScores((s) => [...s, accuracy]);
        const last = index >= exercises.length - 1;
        if (last) {
          await finishWorkout();
        } else {
          autoKeyRef.current = null;
          setIndex((i) => i + 1);
        }
      } catch {
        toast.error(t.loadError);
      }
    },
    [current, sessionId, submitPose, index, exercises.length, finishWorkout, t.loadError],
  );

  useEffect(() => {
    if (!planId || !sessionId) {
      router.replace("/dashboard");
    }
  }, [planId, sessionId, router]);

  const hasRepWorkout = useMemo(
    () => exercises.some((ex) => ex.metric_type === "reps"),
    [exercises],
  );

  useEffect(() => {
    if (phase !== "run" || !hasRepWorkout) return;
    setSessionElapsed(0);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    sessionIntervalRef.current = setInterval(() => {
      setSessionElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, [phase, hasRepWorkout, sessionId]);

  useEffect(() => {
    if (phase !== "run" || !isRepMetric) return;
    setPoseElapsed(0);
    if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    poseIntervalRef.current = setInterval(() => {
      setPoseElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    };
  }, [phase, index, isRepMetric, current?.pose_id]);

  useEffect(() => {
    if (phase !== "run" || !current || isRepMetric) return;
    const sec = exerciseAllocatedSeconds(current, DEV_TIMER);
    setTimer(sec);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, index, current?.pose_id, current?.duration_min, current?.metric_type, isRepMetric]);

  useEffect(() => {
    if (phase !== "run" || !current || timer > 0 || isRepMetric) return;
    const key = `${sessionId}-${current.pose_id}-${index}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    void goNextOrFinish(resolveSubmittedAccuracy(), allocated);
  }, [
    timer,
    phase,
    current,
    index,
    sessionId,
    allocated,
    goNextOrFinish,
    resolveSubmittedAccuracy,
    isRepMetric,
  ]);

  useEffect(() => {
    if (phase !== "run" || !isFaceAnalyzable || !faceAnalysis.isRepComplete) return;
    const key = `rep-${sessionId}-${current?.pose_id}-${index}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    void goNextOrFinish(100, Math.max(1, poseElapsed));
  }, [
    phase,
    isFaceAnalyzable,
    faceAnalysis.isRepComplete,
    sessionId,
    current?.pose_id,
    index,
    poseElapsed,
    goNextOrFinish,
  ]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  const onComplete = () => {
    if (!current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (poseIntervalRef.current) clearInterval(poseIntervalRef.current);
    const elapsed = isRepMetric
      ? Math.max(1, poseElapsed)
      : Math.max(1, allocated - timer);
    void goNextOrFinish(resolveSubmittedAccuracy(), elapsed);
  };

  const onSkip = () => {
    if (!current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    void goNextOrFinish(FIXED_ACCURACY, 1);
  };

  const onCancel = () => {
    setCancelOpen(false);
    router.push("/dashboard");
  };

  if (!planId || !sessionId) return null;

  if (planLoading || !plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!detail || exercises.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-th-text-mut">
        <p>{t.noPlans}</p>
        <Link href="/plans" className="btn-primary mt-4 inline-block">
          {t.plans}
        </Link>
      </div>
    );
  }

  const pctBar = Math.min(100, ((index + 1) / exercises.length) * 100);

  const showCameraStage =
    current?.is_analyzable &&
    camPermission === "granted" &&
    !poseRulesError &&
    !modelPipelineError &&
    (isBodyAnalyzable ? rulesReady : facePipelineReady);

  if (phase === "done") {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-th-text">{t.congratulations}</h1>
          <p className="mt-2 text-th-text-mut">{t.trainingCompleted}</p>
          <p className="mt-6 text-3xl font-bold text-sage-600 dark:text-sage-400">%{Math.round(avg)}</p>
          <p className="text-sm text-th-text-mut">{t.averageScore}</p>
        </div>
        <h2 className="mb-3 mt-10 text-sm font-semibold text-th-text">{t.trainingResults}</h2>
        <ul className="space-y-2 rounded-2xl border border-th-border bg-th-card p-4 text-sm">
          {exercises.map((ex, i) => (
            <li
              key={`${ex.pose_id}-${i}`}
              className="flex items-center justify-between gap-3 border-b border-th-border pb-2 last:border-0 last:pb-0"
            >
              <span className="text-th-text">
                {i + 1}. {ex.name}
              </span>
              <span className="shrink-0 font-semibold text-sage-600 dark:text-sage-400">
                %{Math.round(scores[i] ?? 0)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="btn-primary inline-block">
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  const analyzableFlow = !!current?.is_analyzable;
  const accVal = lastAnalyzeResult?.overall_accuracy ?? liveAccuracy ?? 0;
  const ruleCount = lastAnalyzeResult?.rules?.length ?? 0;
  const displayFps = isFaceAnalyzable ? faceAnalysis.faceFps : fps;
  const sessionTotalSec =
    detail.total_duration_min > 0 ? detail.total_duration_min * 60 : 0;
  const timerBadge = isRepMetric
    ? sessionTotalSec > 0
      ? `${formatTime(sessionElapsed)} / ${formatTime(sessionTotalSec)}`
      : formatTime(sessionElapsed)
    : formatTime(timer);

  return (
    <div
      className={
        analyzableFlow
          ? "flex min-h-0 flex-1 flex-col px-2 pb-3 pt-2 sm:px-4 md:px-6"
          : "mx-auto flex min-h-0 flex-1 flex-col max-w-xl px-4 py-6 md:py-10"
      }
    >
      <div className="mx-auto mb-4 flex w-full max-w-6xl shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-th-text-mut hover:text-th-text"
        >
          <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {t.close}
        </button>
        <p className="truncate text-center text-sm font-medium text-th-text">
          {detail.title} · {index + 1}/{exercises.length}
        </p>
        <span className="w-10 shrink-0" />
      </div>

      <div className="mx-auto mb-4 h-2 w-full max-w-6xl shrink-0 overflow-hidden rounded-full bg-th-muted">
        <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${pctBar}%` }} />
      </div>

      {analyzableFlow ? (
        <div className="relative mb-3 flex min-h-[78vh] w-full flex-1 overflow-hidden rounded-2xl border border-th-border bg-black shadow-inner xl:min-h-[calc(100dvh-12.5rem)]">
          {camPermission === "checking" ? (
            <div className="flex min-h-[min(60vh,480px)] w-full flex-col items-center justify-center gap-3 p-8 text-center">
              <LoadingSpinner size="md" />
              <p className="max-w-sm text-sm text-white/85">{t.trainingCameraChecking}</p>
            </div>
          ) : showCameraStage ? (
            <>
              <PoseCameraStage
                containerRef={cameraStageRef}
                videoRef={videoRef}
                canvasRef={canvasRef}
                className="absolute inset-0 h-full w-full"
                mirrorVideo={isFaceAnalyzable}
              />

              <div className="pointer-events-none absolute left-3 top-3 z-20 md:left-4 md:top-4">
                <div className="overlay-badge font-mono text-[11px] text-white md:text-xs">
                  {displayFps > 0 ? `${displayFps} ${t.fpsLabel.toLowerCase()} · ` : ""}
                  {timerBadge}
                </div>
              </div>

              {isFaceAnalyzable && (
                <FaceTrainingOverlays
                  analysisKind={analysisKind}
                  faceRepResult={faceAnalysis.faceRepResult}
                  faceHandRepResult={faceAnalysis.faceHandRepResult}
                  repPulse={faceAnalysis.repPulse}
                  handRepPulse={faceAnalysis.handRepPulse}
                  faceEnterThreshold={faceAnalysis.faceEnterThreshold}
                  pipelineLoading={faceAnalysis.pipelineLoading}
                />
              )}

              {isBodyAnalyzable &&
                (lastAnalyzeResult || liveAccuracy != null) && (
                <div
                  className={`pointer-events-none absolute right-3 top-3 z-20 rounded-2xl border border-white/20 bg-gradient-to-br px-4 py-2.5 text-center shadow-lg backdrop-blur-md md:right-4 md:top-4 md:px-5 md:py-3 ${accuracyAccent(accVal)}`}
                >
                  <p
                    className={`text-3xl font-bold tabular-nums leading-none md:text-4xl ${accuracyTextClass(accVal)}`}
                  >
                    {Math.round(accVal)}%
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/85 md:text-xs">
                    {t.poseTestAccuracyLabel}
                  </p>
                </div>
              )}

              {isFaceAnalyzable && faceAnalysis.faceNotDetected && (
                <div
                  className="absolute left-3 right-3 top-14 z-30 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs text-white backdrop-blur-md md:left-4 md:right-4 md:text-sm"
                  style={{ backgroundColor: "rgba(234, 179, 8, 0.38)" }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-950/90 md:h-5 md:w-5" />
                  <p>{t.faceNotDetected}</p>
                </div>
              )}

              {visibilityWarning && isBodyAnalyzable && (
                <div
                  className="absolute left-3 right-3 top-14 z-30 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs text-white backdrop-blur-md md:left-4 md:right-4 md:text-sm"
                  style={{ backgroundColor: "rgba(234, 179, 8, 0.38)" }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-950/90 md:h-5 md:w-5" />
                  <p>{t.notEnoughVisibility}</p>
                </div>
              )}

              {isBodyAnalyzable && rulesReady && !lastAnalyzeResult && !visibilityWarning ? (
                <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 max-w-sm -translate-x-1/2 px-4 text-center">
                  <p className="rounded-xl bg-black/50 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
                    {t.waitingForData}
                  </p>
                </div>
              ) : null}

              {isBodyAnalyzable && lastAnalyzeResult && !visibilityWarning && (
                <div className="pointer-events-none absolute bottom-[4.5rem] left-1/2 z-20 flex max-w-xs -translate-x-1/2 flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-white/90 md:text-xs">
                  <span>
                    {t.targetScore}: {lastAnalyzeResult.target_score.toFixed(0)}%
                  </span>
                  <span className="text-red-300">
                    {t.faultPenalty}: −{lastAnalyzeResult.fault_penalty.toFixed(0)}%
                  </span>
                </div>
              )}

              {isBodyAnalyzable &&
                lastAnalyzeResult &&
                !lastAnalyzeResult.is_reliable &&
                !visibilityWarning && (
                <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 max-w-sm -translate-x-1/2 px-4 text-center">
                  <p className="text-[10px] text-amber-200/95 md:text-xs">{t.lowReliability}</p>
                </div>
              )}

              {isBodyAnalyzable && (
              <div
                className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
                  rulesOpen ? "translate-y-0" : "translate-y-[calc(100%-2.75rem)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setRulesOpen((o) => !o)}
                  className="overlay-panel flex w-full items-center justify-between rounded-b-none border-b-0 px-4 py-2.5 text-left text-sm font-medium text-white"
                >
                  <span className="flex items-center gap-2">
                    {rulesOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                    {t.ruleBreakdown}
                    {ruleCount > 0 ? ` (${ruleCount})` : ""}
                  </span>
                </button>
                <div className="overlay-panel max-h-[min(36vh,280px)] space-y-2 overflow-y-auto rounded-t-none border-t-0 p-3 md:p-4">
                  {!lastAnalyzeResult ? (
                    <p className="text-sm text-white/75">{t.waitingForData}</p>
                  ) : lastAnalyzeResult.rules.length === 0 ? (
                    <p className="text-sm text-white/75">{t.noRulesDefined}</p>
                  ) : (
                    lastAnalyzeResult.rules.map((r, i) => {
                      const isFault = r.rule_type === "fault";
                      const isLowVis = r.status === "low_visibility";
                      const ruleFeedback =
                        locale === "tr" ? r.feedback_tr : r.feedback_en;
                      return (
                        <div key={i} className={ruleOverlayClass(r)}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium capitalize">
                              {isFault && r.triggered
                                ? "✗"
                                : isLowVis
                                  ? "…"
                                  : r.score >= 90
                                    ? "✓"
                                    : r.score >= 60
                                      ? "⚠"
                                      : "✗"}{" "}
                              {r.joint.replace(/_/g, " ")}
                              <span className="text-xs font-normal text-white/65">
                                ({isFault ? t.faultLabel : t.targetLabel})
                              </span>
                            </span>
                            {isLowVis ? (
                              <span className="text-xs text-white/65">{t.lowVisibility}</span>
                            ) : !isFault ? (
                              <span className={`font-semibold ${accuracyTextClass(r.score)}`}>
                                {r.actual_angle.toFixed(1)}° · {r.score.toFixed(0)}%
                              </span>
                            ) : (
                              <span
                                className={
                                  r.triggered ? "font-bold text-red-300" : "text-white/65"
                                }
                              >
                                {r.triggered
                                  ? `-${r.penalty.toFixed(1)}%`
                                  : t.noFault}
                              </span>
                            )}
                          </div>
                          {!isLowVis && (
                            <p className="mt-1 text-xs text-white/70">
                              {t.expected}: {r.expected_range[0]}–{r.expected_range[1]}°
                            </p>
                          )}
                          {!isLowVis && ruleFeedback && (
                            <p className="mt-1 text-xs text-white/90">&quot;{ruleFeedback}&quot;</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[min(50vh,400px)] w-full flex-col items-center justify-center bg-gradient-to-b from-th-subtle/10 to-black p-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-white/90">
                <PersonStanding className="h-12 w-12" strokeWidth={1.5} aria-hidden />
              </div>
              {poseRulesLoading && (
                <p className="mt-6 text-sm text-white/80">{t.trainingCameraChecking}</p>
              )}
            </div>
          )}

          {!showCameraStage && isRepMetric && (
            <div className="pointer-events-none absolute left-3 top-3 z-20 md:left-4 md:top-4">
              <div className="overlay-badge font-mono text-[11px] text-white md:text-xs">
                {timerBadge}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 overflow-hidden rounded-3xl border border-th-border bg-gradient-to-b from-th-subtle to-th-card">
          <div className="flex min-h-[180px] flex-col items-center justify-center p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-sage-400/15 text-sage-600 dark:text-sage-400">
              <PersonStanding className="h-12 w-12" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
          <div className="border-t border-th-border bg-th-card/80 px-4 py-3 text-center">
            <p className="font-mono text-4xl font-bold tabular-nums text-th-text">
              {isRepMetric ? timerBadge : formatTime(timer)}
            </p>
            {DEV_TIMER && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{t.devTimerNote}</p>
            )}
          </div>
        </div>
      )}

      <div
        className={
          analyzableFlow
            ? "mx-auto mt-1 w-full max-w-2xl shrink-0 px-2 pb-2 md:px-4"
            : ""
        }
      >
      {current?.is_analyzable && camPermission === "denied" && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-th-text">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p>{t.trainingCameraDeniedHint}</p>
          </div>
          <button type="button" onClick={() => void retryCamera()} className="btn-ghost self-start text-sm">
            {t.trainingRetryCamera}
          </button>
        </div>
      )}

      {current?.is_analyzable && modelPipelineError && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-th-text">
          <p>{t.trainingModelLoadError}</p>
          <button type="button" onClick={retryModel} className="btn-ghost self-start text-sm">
            {t.trainingRetryCamera}
          </button>
        </div>
      )}

      {current?.is_analyzable && isFaceAnalyzable && (
        <p className="mb-4 text-sm text-purple-800 dark:text-purple-200">{t.faceTrainingHint}</p>
      )}

      {current?.is_analyzable && poseRulesError && (
        <div className="mb-4 flex gap-2 rounded-2xl border border-th-border bg-th-muted/50 px-4 py-3 text-sm text-th-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-th-text-mut" aria-hidden />
          <p>{t.poseRulesLoadError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {current?.is_analyzable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-400/15 px-2.5 py-0.5 text-xs font-medium text-sage-700 dark:text-sage-300">
            <Video className="h-3.5 w-3.5" aria-hidden />
            {t.cameraAnalyzable}
          </span>
        )}
      </div>

      <h2 className="mt-4 text-xl font-bold text-th-text">{current?.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-th-text-sec">{current?.instructions}</p>

      {next && (
        <p className="mt-4 text-sm text-th-text-mut">
          {t.nextPose}: {next.name}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onComplete}
          disabled={submitPose.isPending}
          className="btn-primary flex-1 justify-center"
        >
          {submitPose.isPending ? <LoadingSpinner size="sm" /> : t.completePose}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitPose.isPending}
          className="btn-ghost flex-1 justify-center"
        >
          {t.skipPose}
        </button>
      </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title={t.cancelTraining}
        description={t.cancelTrainingDesc}
        confirmLabel={t.close}
        cancelLabel={t.back}
        variant="danger"
        onConfirm={onCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}

export default function TrainingSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TrainingSessionContent />
    </Suspense>
  );
}
