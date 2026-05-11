"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Video,
} from "lucide-react";
import { useApp } from "@/components/layout/AppProvider";
import {
  analyzePoseClientSide,
  type LandmarkRule,
  type AnalyzeResult,
} from "@/lib/poseAnalyzer";
import { useAnalyzablePoses, usePose } from "@/hooks/usePoses";
import {
  useMediapipePoseCamera,
  MEDIAPIPE_CAM_H,
  MEDIAPIPE_CAM_W,
  type MediapipeLandmarkFrame,
} from "@/hooks/useMediapipePoseCamera";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import {
  createFaceRepCounter,
  FACE_EXERCISE_CONFIGS,
  FACE_BAR_LABELS,
  type FaceRepResult,
} from "@/lib/faceRepCounter";
import { PoseCameraStage } from "@/components/training/PoseCameraStage";
import {
  accuracyAccent,
  accuracyTextClass,
  ruleOverlayClass,
} from "@/lib/poseTestCameraTheme";
import type { Pose } from "@/types/yoga";
import type { Translations } from "@/lib/i18n";

type ModelComplexity = 0 | 1 | 2;

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PoseTestPage() {
  const { t, locale } = useApp();
  const searchParams = useSearchParams();
  const urlPoseId = searchParams.get("poseId");
  const urlPoseApplied = useRef(false);

  const shellRef = useRef<HTMLDivElement>(null);

  const { data: poses = [] } = useAnalyzablePoses();
  const [selectedPose, setSelectedPose] = useState<string>("");
  const poseQuery = usePose(selectedPose);
  const poseDetail = poseQuery.data;
  const rulesLoading = !!selectedPose && poseQuery.isLoading;
  const poseLoadError = poseQuery.isError;
  const resolvedPose =
    poseDetail && poseDetail.pose_id === selectedPose ? poseDetail : undefined;
  const analysisKind = resolvedPose?.analysis_kind ?? "body";
  const isFaceExercise = analysisKind === "face";

  const faceLandmarker = useFaceLandmarker();
  const {
    start: startFaceLandmarker,
    stop: stopFaceLandmarker,
    currentFrame: faceFrame,
    fps: faceFps,
    isLoading: faceLmLoading,
    error: faceLmError,
  } = faceLandmarker;
  const faceRepCounterRef = useRef<ReturnType<typeof createFaceRepCounter>>(null);
  const [faceRepResult, setFaceRepResult] = useState<FaceRepResult | null>(null);
  const [repPulse, setRepPulse] = useState(false);
  const prevRepsRef = useRef(0);

  const { facePoses, bodyPoses } = useMemo(() => {
    const face: Pose[] = [];
    const body: Pose[] = [];
    for (const p of poses) {
      const kind = p.analysis_kind ?? "body";
      if (kind === "face") face.push(p);
      else body.push(p);
    }
    return { facePoses: face, bodyPoses: body };
  }, [poses]);

  const [selectedRules, setSelectedRules] = useState<LandmarkRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [modelComplexity, setModelComplexity] = useState<ModelComplexity>(0);
  const [error, setError] = useState<string | null>(null);
  const [visibilityWarning, setVisibilityWarning] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rulesRef = useRef<LandmarkRule[]>([]);
  const selectedPoseRef = useRef<string>("");

  const handleFrame = useCallback((frame: MediapipeLandmarkFrame) => {
    const { landmarks } = frame;
    if (!landmarks) {
      setVisibilityWarning(true);
      setResult(null);
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
    const analyzeResult = analyzePoseClientSide(
      selectedPoseRef.current,
      rulesRef.current,
      mapped,
    );
    if (analyzeResult === null) {
      setVisibilityWarning(true);
      setResult(null);
    } else {
      setVisibilityWarning(false);
      setResult(analyzeResult);
    }
  }, []);

  const handleModelError = useCallback(() => {
    setError(t.poseModelLoadError);
  }, [t]);

  const { fps } = useMediapipePoseCamera({
    active: isAnalyzing && !!selectedPose && !isFaceExercise,
    containerRef: shellRef,
    videoRef,
    canvasRef,
    modelComplexity,
    restartKey: selectedPose,
    onFrame: handleFrame,
    onModelLoadError: handleModelError,
  });

  useEffect(() => {
    if (!resolvedPose) return;
    if (resolvedPose.analysis_kind === "face") {
      faceRepCounterRef.current = createFaceRepCounter(
        resolvedPose.pose_id,
        resolvedPose.rep_target > 0 ? resolvedPose.rep_target : undefined,
      );
      setFaceRepResult(null);
    } else {
      stopFaceLandmarker();
      faceRepCounterRef.current = null;
      setFaceRepResult(null);
    }
  }, [resolvedPose?.pose_id, resolvedPose?.analysis_kind, stopFaceLandmarker]);

  useEffect(() => {
    if (!isAnalyzing || !isFaceExercise) return;
    const video = videoRef.current;
    if (!video) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: MEDIAPIPE_CAM_W },
            height: { ideal: MEDIAPIPE_CAM_H },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        const el = videoRef.current;
        if (!el) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        el.srcObject = stream;
        await el.play().catch(() => {});
      } catch {
        setError(t.poseModelLoadError);
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
      const el = videoRef.current;
      if (el) el.srcObject = null;
    };
  }, [isAnalyzing, isFaceExercise, selectedPose, t.poseModelLoadError]);

  useEffect(() => {
    if (!isAnalyzing || !isFaceExercise) return;
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    const onReady = () => {
      if (!cancelled && v.videoWidth) startFaceLandmarker(v);
    };
    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onReady();
    else v.addEventListener("loadeddata", onReady);
    return () => {
      cancelled = true;
      v.removeEventListener("loadeddata", onReady);
      stopFaceLandmarker();
    };
  }, [
    isAnalyzing,
    isFaceExercise,
    selectedPose,
    startFaceLandmarker,
    stopFaceLandmarker,
  ]);

  useEffect(() => {
    if (!isFaceExercise || !faceFrame || !faceRepCounterRef.current) return;
    if (!faceFrame.faceDetected) return;
    if (faceRepResult?.isComplete) return;
    const result = faceRepCounterRef.current.update(faceFrame.blendshapes);
    setFaceRepResult(result);
  }, [isFaceExercise, faceFrame, faceRepResult?.isComplete]);

  useEffect(() => {
    if (isFaceExercise && faceLmError) setError(faceLmError);
  }, [isFaceExercise, faceLmError]);

  useEffect(() => {
    if (!faceRepResult) {
      prevRepsRef.current = 0;
      return;
    }
    if (faceRepResult.reps < prevRepsRef.current) {
      prevRepsRef.current = faceRepResult.reps;
      return;
    }
    if (faceRepResult.reps > prevRepsRef.current) {
      prevRepsRef.current = faceRepResult.reps;
      setRepPulse(true);
      const id = window.setTimeout(() => setRepPulse(false), 300);
      return () => window.clearTimeout(id);
    }
  }, [faceRepResult]);

  useEffect(() => {
    rulesRef.current = selectedRules;
  }, [selectedRules]);

  useEffect(() => {
    selectedPoseRef.current = selectedPose;
  }, [selectedPose]);

  useEffect(() => {
    if (urlPoseApplied.current || !urlPoseId || poses.length === 0) return;
    if (poses.some((p) => p.pose_id === urlPoseId)) {
      setSelectedPose(urlPoseId);
      urlPoseApplied.current = true;
    }
  }, [urlPoseId, poses]);

  useEffect(() => {
    if (!selectedPose) {
      setSelectedRules([]);
      setError(null);
      return;
    }
    if (poseLoadError) {
      setError(t.poseRulesLoadError);
      setSelectedRules([]);
      return;
    }
    if (poseDetail) {
      setSelectedRules((poseDetail.landmark_rules ?? []) as LandmarkRule[]);
      setError(null);
    }
  }, [selectedPose, poseDetail, poseLoadError, t]);

  useEffect(() => {
    if (!isAnalyzing) {
      setElapsed(0);
      return;
    }
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  const handleStop = () => {
    stopFaceLandmarker();
    setIsAnalyzing(false);
    setResult(null);
    setVisibilityWarning(false);
    setRulesOpen(false);
    setFaceRepResult(null);
  };

  const handlePoseChange = (poseId: string) => {
    setSelectedPose(poseId);
    setError(null);
    if (isAnalyzing) {
      setResult(null);
      setVisibilityWarning(false);
    }
  };

  const handleModelChange = (c: ModelComplexity) => {
    setModelComplexity(c);
    if (isAnalyzing) {
      setResult(null);
      setVisibilityWarning(false);
    }
  };

  const modelLabels: Record<ModelComplexity, string> = {
    0: t.modelLite,
    1: t.modelFull,
    2: t.modelHeavy,
  };

  const canStart =
    !!selectedPose &&
    !rulesLoading &&
    !!resolvedPose &&
    (isFaceExercise || selectedRules.length > 0) &&
    !isAnalyzing;

  const ruleCount = result?.rules?.length ?? 0;

  const accVal = result?.overall_accuracy ?? 0;
  const displayFps = isFaceExercise ? faceFps : fps;
  const faceConfig = FACE_EXERCISE_CONFIGS[selectedPose];
  const faceEnterThreshold = faceConfig?.enterThreshold ?? 0.45;
  const faceBarLabelKey = (FACE_BAR_LABELS[selectedPose] ?? "jawOpenLevel") as keyof Translations;
  const faceBarLabel = t[faceBarLabelKey];

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${isAnalyzing ? "px-2 pb-3 pt-2 sm:px-4 md:px-6" : "px-4 pb-8 pt-4 md:px-8"}`}
    >
      <div
        className={`mx-auto flex w-full min-h-0 flex-1 flex-col ${isAnalyzing ? "max-w-none gap-3" : "max-w-6xl gap-4"}`}
      >
        <header className="shrink-0">
          <h1
            className={`font-bold text-th-text ${isAnalyzing ? "text-xl md:text-2xl" : "text-2xl"}`}
          >
            {t.poseTest}
          </h1>
          {!isAnalyzing && (
            <p className="mt-1 text-sm text-th-text-sec">{t.poseTestSubtitle}</p>
          )}
        </header>

        {!isAnalyzing && (
          <div className="card flex flex-col items-center gap-8 py-10 md:py-12">
            <Video
              className="h-14 w-14 text-sage-500"
              strokeWidth={1.25}
              aria-hidden
            />
            <div className="w-full max-w-md space-y-3">
              <div>
                <p className="mb-1 text-xs text-th-text-sec">{t.selectPose}</p>
                <select
                  className="input-field"
                  value={selectedPose}
                  onChange={(e) => handlePoseChange(e.target.value)}
                >
                  <option value="">— {t.selectPose} —</option>
                  {facePoses.length > 0 && (
                    <optgroup label={t.faceYoga}>
                      {facePoses.map((p) => (
                        <option key={p.pose_id} value={p.pose_id}>
                          {locale === "tr" ? p.name_tr : p.name_en}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {bodyPoses.length > 0 && (
                    <optgroup label={t.bodyYoga}>
                      {bodyPoses.map((p) => (
                        <option key={p.pose_id} value={p.pose_id}>
                          {locale === "tr" ? p.name_tr : p.name_en}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {!isFaceExercise && (
              <div>
                <p className="mb-1.5 text-xs text-th-text-sec">
                  {t.poseTestPoseModel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {([0, 1, 2] as ModelComplexity[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleModelChange(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        modelComplexity === c
                          ? "border-sage-400 bg-sage-400/15 text-sage-700 dark:text-sage-300"
                          : "border-th-border bg-th-card text-th-text-sec hover:bg-th-subtle"
                      }`}
                    >
                      {modelLabels[c]}
                    </button>
                  ))}
                </div>
              </div>
              )}
              <button
                type="button"
                onClick={() => setIsAnalyzing(true)}
                disabled={!canStart}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rulesLoading ? "…" : t.poseTestOpenCamera}
              </button>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex min-h-0 flex-1 flex-col gap-2 md:gap-3">
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-th-border bg-th-card p-3 shadow-sm md:gap-4 md:p-4">
              <div className="min-w-[min(100%,220px)] flex-1">
                <label className="text-xs font-medium text-th-text-sec">
                  {t.selectPose}
                </label>
                <select
                  className="input-field mt-1.5 py-2.5 text-sm"
                  value={selectedPose}
                  onChange={(e) => handlePoseChange(e.target.value)}
                  disabled={rulesLoading}
                >
                  <option value="">— {t.selectPose} —</option>
                  {facePoses.length > 0 && (
                    <optgroup label={t.faceYoga}>
                      {facePoses.map((p) => (
                        <option key={p.pose_id} value={p.pose_id}>
                          {locale === "tr" ? p.name_tr : p.name_en}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {bodyPoses.length > 0 && (
                    <optgroup label={t.bodyYoga}>
                      {bodyPoses.map((p) => (
                        <option key={p.pose_id} value={p.pose_id}>
                          {locale === "tr" ? p.name_tr : p.name_en}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {!isFaceExercise && (
              <div className="flex min-w-0 flex-1 flex-col sm:max-w-md">
                <span className="text-xs font-medium text-th-text-sec">
                  {t.poseTestPoseModel}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {([0, 1, 2] as ModelComplexity[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleModelChange(c)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        modelComplexity === c
                          ? "bg-sage-400 text-white shadow-sm"
                          : "bg-th-subtle text-th-text-sec hover:bg-th-muted"
                      }`}
                    >
                      {modelLabels[c]}
                    </button>
                  ))}
                </div>
              </div>
              )}
              <button
                type="button"
                onClick={handleStop}
                className="btn-danger shrink-0 px-6 py-2.5"
              >
                {t.stopAnalysis}
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 w-full overflow-hidden rounded-2xl border border-th-border bg-black shadow-inner min-h-[78vh] xl:min-h-[calc(100dvh-12.5rem)]">
              <PoseCameraStage
                containerRef={shellRef}
                videoRef={videoRef}
                canvasRef={canvasRef}
                className="absolute inset-0 h-full w-full"
                mirrorVideo={isAnalyzing && isFaceExercise}
              />

              <div className="pointer-events-none absolute left-3 top-3 z-20 md:left-4 md:top-4">
                <div className="overlay-badge font-mono text-[11px] text-white md:text-xs">
                  {displayFps} {t.fpsLabel.toLowerCase()} · {formatElapsed(elapsed)}
                </div>
              </div>

              {!isFaceExercise &&
                selectedPose &&
                selectedRules.length > 0 &&
                result && (
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

              {visibilityWarning && !isFaceExercise && (
                <div
                  className="absolute left-3 right-3 top-14 z-30 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs text-white backdrop-blur-md md:left-4 md:right-4 md:text-sm"
                  style={{ backgroundColor: "rgba(234, 179, 8, 0.38)" }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-950/90 md:h-5 md:w-5" />
                  <p>{t.notEnoughVisibility}</p>
                </div>
              )}

              {isFaceExercise && faceFrame && !faceFrame.faceDetected && (
                <div className="fixed top-20 left-1/2 z-30 max-w-md -translate-x-1/2 rounded-xl bg-amber-500/30 px-6 py-3 backdrop-blur-md">
                  <span className="text-sm text-white">{t.faceNotDetected}</span>
                </div>
              )}

              {isFaceExercise && faceLmLoading && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/35">
                  <p className="rounded-xl overlay-panel px-5 py-3 text-sm text-white">
                    {t.waitingForData}
                  </p>
                </div>
              )}

              {isFaceExercise && faceRepResult && (
                <div className="pointer-events-none fixed top-1/3 left-1/2 z-20 flex max-w-[min(100vw-2rem,20rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center p-6 overlay-panel">
                  <div
                    className={`text-5xl font-bold text-white transition-transform duration-200 ${
                      repPulse ? "scale-125 text-green-400" : "scale-100"
                    }`}
                  >
                    {faceRepResult.reps} / {faceRepResult.target}
                  </div>
                  <div className="mt-1 text-sm text-white/60">{t.reps}</div>
                  <div className="mt-3 h-2 w-48 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-green-400 transition-all duration-200"
                      style={{ width: `${faceRepResult.progress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isFaceExercise && faceRepResult && (
                <div className="pointer-events-none fixed bottom-24 left-1/2 z-20 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 p-4 overlay-panel">
                  <div className="mb-1 text-xs text-white/60">{faceBarLabel}</div>
                  <div className="relative h-3 w-full rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        faceRepResult.currentValue >= faceEnterThreshold
                          ? "bg-green-400"
                          : "bg-amber-400"
                      }`}
                      style={{
                        width: `${Math.min(faceRepResult.currentValue * 100, 100)}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white/60"
                      style={{ left: `${faceEnterThreshold * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-white/40">
                    <span>{t.closed}</span>
                    <span>{t.open}</span>
                  </div>
                </div>
              )}

              {isFaceExercise && faceRepResult?.isComplete && (
                <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="overlay-panel flex max-w-sm flex-col items-center p-8">
                    <div className="mb-2 text-4xl">✅</div>
                    <div className="text-2xl font-bold text-white">
                      {t.congratulations}
                    </div>
                    <div className="mt-2 text-center text-white/60">
                      {faceRepResult.target} {t.repsCompleted}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        faceRepCounterRef.current?.reset();
                        setFaceRepResult(null);
                      }}
                      className="mt-6 rounded-xl bg-green-500 px-6 py-2 font-medium text-white"
                    >
                      {t.tryAgain}
                    </button>
                  </div>
                </div>
              )}

              {!selectedPose || (!isFaceExercise && selectedRules.length === 0) ? (
                <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 max-w-sm -translate-x-1/2 px-4 text-center">
                  <p className="rounded-xl bg-black/55 px-4 py-2 text-xs text-white/95 backdrop-blur-sm md:text-sm">
                    {t.poseTestSelectPoseStart}
                  </p>
                </div>
              ) : null}

              {!isFaceExercise &&
                selectedPose &&
                selectedRules.length > 0 &&
                !result &&
                !visibilityWarning ? (
                <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 px-4">
                  <p className="rounded-xl bg-black/50 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
                    {t.waitingForData}
                  </p>
                </div>
              ) : null}

              {!isFaceExercise && result && !visibilityWarning && (
                <div className="pointer-events-none absolute bottom-[4.5rem] left-1/2 z-20 flex max-w-xs -translate-x-1/2 flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-white/90 md:text-xs">
                  <span>
                    {t.targetScore}: {result.target_score.toFixed(0)}%
                  </span>
                  <span className="text-red-300">
                    {t.faultPenalty}: −{result.fault_penalty.toFixed(0)}%
                  </span>
                </div>
              )}

              {!isFaceExercise &&
                result &&
                !result.is_reliable &&
                !visibilityWarning && (
                <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 max-w-sm -translate-x-1/2 px-4 text-center">
                  <p className="text-[10px] text-amber-200/95 md:text-xs">
                    {t.lowReliability}
                  </p>
                </div>
              )}

              {!isFaceExercise && (
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
                  {!result ? (
                    <p className="text-sm text-white/75">{t.waitingForData}</p>
                  ) : result.rules.length === 0 ? (
                    <p className="text-sm text-white/75">{t.noRulesDefined}</p>
                  ) : (
                    result.rules.map((r, i) => {
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
                              <span className="text-xs text-white/65">
                                {t.lowVisibility}
                              </span>
                            ) : !isFault ? (
                              <span
                                className={`font-semibold ${accuracyTextClass(r.score)}`}
                              >
                                {r.actual_angle.toFixed(1)}° ·{" "}
                                {r.score.toFixed(0)}%
                              </span>
                            ) : (
                              <span
                                className={
                                  r.triggered
                                    ? "font-bold text-red-300"
                                    : "text-white/65"
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
                              {t.expected}: {r.expected_range[0]}–
                              {r.expected_range[1]}°
                            </p>
                          )}
                          {!isLowVis && ruleFeedback && (
                            <p className="mt-1 text-xs text-white/90">
                              &quot;{ruleFeedback}&quot;
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              )}

              {error && (
                <div className="absolute left-4 right-4 top-20 z-[50] mx-auto max-w-lg rounded-xl border border-red-400/45 bg-red-950/85 px-4 py-3 text-sm text-red-100 backdrop-blur-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
