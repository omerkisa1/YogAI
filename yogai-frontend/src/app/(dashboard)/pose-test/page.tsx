"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Square,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/layout/AppProvider";
import {
  analyzePoseClientSide,
  type LandmarkRule,
  type AnalyzeResult,
} from "@/lib/poseAnalyzer";
import { useAnalyzablePoses, usePose } from "@/hooks/usePoses";
import { colors } from "@/lib/colors";

type ModelComplexity = 0 | 1 | 2;

const CAM_W = 1280;
const CAM_H = 720;

function accuracyTextClass(acc: number): string {
  if (acc >= 80) return "text-green-400";
  if (acc >= 50) return "text-amber-400";
  return "text-red-400";
}

function ruleOverlayClass(r: AnalyzeResult["rules"][0]): string {
  const base =
    "rounded-xl border p-3 text-sm transition-colors border-white/15 text-white";
  if (r.status === "low_visibility")
    return `${base} border-l-4 border-l-gray-400 bg-black/45 text-white/75`;
  if (r.rule_type === "fault")
    return r.triggered
      ? `${base} border-l-4 border-l-red-500 bg-red-500/25`
      : `${base} border-l-4 border-l-white/25 bg-black/35`;
  if (r.score >= 90)
    return `${base} border-l-4 border-l-green-400 bg-black/35`;
  if (r.score >= 60)
    return `${base} border-l-4 border-l-amber-400 bg-black/35`;
  return `${base} border-l-4 border-l-red-400 bg-black/35`;
}

function AccuracyCircle({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const size = 168;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = c - (pct / 100) * c;
  const strokeColor =
    pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold tabular-nums text-white">
          {pct.toFixed(0)}%
        </span>
        <span className="text-xs text-white/60">{label}</span>
      </div>
    </div>
  );
}

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
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const { data: poses = [] } = useAnalyzablePoses();
  const [selectedPose, setSelectedPose] = useState<string>("");
  const poseQuery = usePose(selectedPose);
  const poseDetail = poseQuery.data;
  const rulesLoading = !!selectedPose && poseQuery.isLoading;
  const poseLoadError = poseQuery.isError;

  const [selectedRules, setSelectedRules] = useState<LandmarkRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [fps, setFps] = useState(0);
  const [modelComplexity, setModelComplexity] = useState<ModelComplexity>(0);
  const [error, setError] = useState<string | null>(null);
  const [visibilityWarning, setVisibilityWarning] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rulesRef = useRef<LandmarkRule[]>([]);
  const selectedPoseRef = useRef<string>("");
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const lastAnalyzeTime = useRef(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setDims({ w: 0, h: 0 });
      return;
    }
    const el = shellRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.floor(rect.width * dpr));
      const h = Math.max(2, Math.floor(rect.height * dpr));
      setDims({ w, h });
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isAnalyzing]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || dims.w < 2 || dims.h < 2) return;
    c.width = dims.w;
    c.height = dims.h;
  }, [dims]);

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

  useEffect(() => {
    if (!isAnalyzing || !selectedPose) return;

    let pose: unknown;
    let camera: unknown;
    let isMounted = true;
    const ANALYZE_INTERVAL = 100;

    const setup = async () => {
      try {
        const { Pose, POSE_CONNECTIONS } = await import("@mediapipe/pose");
        const { Camera } = await import("@mediapipe/camera_utils");
        const { drawConnectors, drawLandmarks } = await import(
          "@mediapipe/drawing_utils"
        );

        if (!isMounted) return;

        const poseInstance = new Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose = poseInstance;

        poseInstance.setOptions({
          modelComplexity,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseInstance.onResults(
          (results: {
            image: CanvasImageSource;
            poseLandmarks?: Array<{
              x: number;
              y: number;
              z: number;
              visibility?: number;
            }>;
          }) => {
            if (!isMounted) return;

            frameCount.current++;
            const now = Date.now();
            if (now - lastFpsTime.current >= 1000) {
              setFps(frameCount.current);
              frameCount.current = 0;
              lastFpsTime.current = now;
            }

            const ctx = canvasRef.current?.getContext("2d");
            if (
              ctx &&
              canvasRef.current &&
              canvasRef.current.width >= 2 &&
              canvasRef.current.height >= 2
            ) {
              const w = canvasRef.current.width;
              const h = canvasRef.current.height;
              ctx.save();
              ctx.clearRect(0, 0, w, h);
              ctx.translate(w, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(results.image, 0, 0, w, h);

              if (results.poseLandmarks) {
                drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                  color: colors.primaryLight,
                  lineWidth: 3,
                });
                drawLandmarks(ctx, results.poseLandmarks, {
                  color: colors.secondary,
                  lineWidth: 2,
                });
              }

              ctx.restore();
            }

            if (
              results.poseLandmarks &&
              now - lastAnalyzeTime.current > ANALYZE_INTERVAL
            ) {
              lastAnalyzeTime.current = now;
              const rules = rulesRef.current;
              if (rules.length > 0) {
                const landmarks = results.poseLandmarks.map((lm, idx) => ({
                  index: idx,
                  x: lm.x,
                  y: lm.y,
                  z: lm.z,
                  visibility: lm.visibility ?? 0,
                }));

                const analyzeResult = analyzePoseClientSide(
                  selectedPoseRef.current,
                  rules,
                  landmarks,
                );

                if (analyzeResult === null) {
                  setVisibilityWarning(true);
                  setResult(null);
                } else {
                  setVisibilityWarning(false);
                  setResult(analyzeResult);
                }
              }
            }
          },
        );

        if (videoRef.current) {
          let isProcessing = false;

          const cam = new Camera(videoRef.current, {
            onFrame: async () => {
              if (!videoRef.current || !isMounted) return;
              if (isProcessing) return;

              isProcessing = true;
              try {
                await poseInstance.send({ image: videoRef.current });
              } catch {
              } finally {
                isProcessing = false;
              }
            },
            width: CAM_W,
            height: CAM_H,
          });
          camera = cam;
          cam.start();
        }
      } catch {
        if (isMounted) {
          setError(t.poseModelLoadError);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (
        camera &&
        typeof (camera as { stop?: () => void }).stop === "function"
      ) {
        (camera as { stop: () => void }).stop();
      }
      if (pose) {
        setTimeout(() => {
          try {
            (pose as { close: () => void }).close();
          } catch {
          }
        }, 100);
      }
    };
  }, [isAnalyzing, selectedPose, modelComplexity, t]);

  const handleStop = () => {
    setIsAnalyzing(false);
    setResult(null);
    setFps(0);
    setVisibilityWarning(false);
    setRulesOpen(false);
    setControlsOpen(false);
    frameCount.current = 0;
    setDims({ w: 0, h: 0 });
  };

  const handlePoseChange = (poseId: string) => {
    if (isAnalyzing) handleStop();
    setSelectedPose(poseId);
    setError(null);
  };

  const handleModelChange = (c: ModelComplexity) => {
    setModelComplexity(c);
    if (isAnalyzing) {
      setResult(null);
      setFps(0);
      setVisibilityWarning(false);
      frameCount.current = 0;
    }
  };

  const modelLabels: Record<ModelComplexity, string> = {
    0: t.modelLite,
    1: t.modelFull,
    2: t.modelHeavy,
  };

  const selectedLabel =
    poses.find((p) => p.pose_id === selectedPose) &&
    (locale === "tr"
      ? poses.find((p) => p.pose_id === selectedPose)!.name_tr
      : poses.find((p) => p.pose_id === selectedPose)!.name_en);

  const canStart =
    !!selectedPose &&
    !rulesLoading &&
    selectedRules.length > 0 &&
    !isAnalyzing;

  const ruleCount = result?.rules?.length ?? 0;

  const renderControls = (onVideo: boolean) => (
    <div className="space-y-3">
      <div>
        <p
          className={
            onVideo ? "mb-1 text-xs text-white/75" : "mb-1 text-xs text-th-text-sec"
          }
        >
          {t.selectPose}
        </p>
        <select
          className={
            onVideo
              ? "w-full rounded-xl border border-white/25 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-white/45"
              : "input-field"
          }
          value={selectedPose}
          onChange={(e) => handlePoseChange(e.target.value)}
          disabled={isAnalyzing}
        >
          <option value="">— {t.selectPose} —</option>
          {poses.map((p) => (
            <option key={p.pose_id} value={p.pose_id}>
              {locale === "tr" ? p.name_tr : p.name_en}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p
          className={
            onVideo
              ? "mb-1.5 text-xs text-white/75"
              : "mb-1.5 text-xs text-th-text-sec"
          }
        >
          {t.poseTestPoseModel}
        </p>
        <div className="flex flex-wrap gap-2">
          {([0, 1, 2] as ModelComplexity[]).map((c) => (
            <button
              key={c}
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleModelChange(c)}
              className={
                onVideo
                  ? `rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
                      modelComplexity === c
                        ? "bg-white/25 text-white ring-1 ring-white/45"
                        : "bg-black/40 text-white/85 hover:bg-black/55"
                    }`
                  : `rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
                      modelComplexity === c
                        ? "border-sage-400 bg-sage-400/15 text-sage-700 dark:text-sage-300"
                        : "border-th-border bg-th-card text-th-text-sec hover:bg-th-subtle"
                    }`
              }
            >
              {modelLabels[c]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!isAnalyzing ? (
          <button
            type="button"
            onClick={() => setIsAnalyzing(true)}
            disabled={!canStart}
            className="btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rulesLoading ? "…" : t.poseTestOpenCamera}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="btn-danger flex-1 justify-center"
          >
            {t.stopAnalysis}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-8 pt-4 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
        <header className="shrink-0">
          <h1 className="text-2xl font-bold text-th-text">{t.poseTest}</h1>
          <p className="mt-1 text-sm text-th-text-sec">{t.poseTestSubtitle}</p>
        </header>

        {!isAnalyzing && (
          <div className="card flex flex-col items-center gap-8 py-10 md:py-12">
            <Video
              className="h-14 w-14 text-sage-500"
              strokeWidth={1.25}
              aria-hidden
            />
            <div className="w-full max-w-md">{renderControls(false)}</div>
          </div>
        )}

        {isAnalyzing && (
          <div
            ref={shellRef}
            className="relative flex min-h-[min(72vh,880px)] w-full flex-1 overflow-hidden rounded-2xl border border-th-border bg-black shadow-lg"
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className="pointer-events-none absolute h-px w-px opacity-0"
              width={CAM_W}
              height={CAM_H}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full object-cover"
              width={dims.w}
              height={dims.h}
            />

            <div className="overlay-badge absolute left-3 top-3 z-20 font-mono text-xs text-white md:left-4 md:top-4">
              {t.fpsLabel}: {fps}
            </div>
            <div className="absolute right-3 top-3 z-20 flex items-center gap-2 md:right-4 md:top-4">
              <div className="overlay-badge font-mono text-xs text-white">
                {formatElapsed(elapsed)}
              </div>
              <button
                type="button"
                onClick={handleStop}
                className="overlay-panel flex h-10 w-10 items-center justify-center rounded-full p-0 text-white transition-colors hover:bg-white/10"
                aria-label={t.stopAnalysis}
              >
                <Square className="h-4 w-4 fill-current" strokeWidth={0} />
              </button>
            </div>

            <div className="absolute left-1/2 top-14 z-30 w-[min(94%,400px)] -translate-x-1/2 md:top-16">
              {!controlsOpen ? (
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="overlay-panel flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-white"
                >
                  <span className="truncate">
                    {selectedLabel || t.selectPose}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-80" />
                </button>
              ) : (
                <div className="overlay-panel relative max-h-[70vh] overflow-y-auto p-4">
                  <button
                    type="button"
                    onClick={() => setControlsOpen(false)}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-white/85 hover:bg-white/10"
                    aria-label={t.close}
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                  {renderControls(true)}
                </div>
              )}
            </div>

            {visibilityWarning && (
              <div
                className="absolute left-3 right-3 top-[52px] z-30 flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-white backdrop-blur-md md:left-6 md:right-6"
                style={{ backgroundColor: "rgba(234, 179, 8, 0.38)" }}
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-950/90" />
                <p>{t.notEnoughVisibility}</p>
              </div>
            )}

            <div className="pointer-events-none absolute left-1/2 top-[32%] z-30 w-[min(92%,320px)] -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="pointer-events-auto">
                {!selectedPose || selectedRules.length === 0 ? (
                  <p className="overlay-panel px-4 py-3 text-sm text-white">
                    {t.poseTestSelectPoseStart}
                  </p>
                ) : result ? (
                  <div className="overlay-panel flex flex-col items-center gap-3 rounded-2xl p-5">
                    <AccuracyCircle
                      value={result.overall_accuracy}
                      label={t.poseTestAccuracyLabel}
                    />
                    <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-white/15">
                      <div
                        className={`h-full rounded-full transition-all ${
                          result.overall_accuracy >= 80
                            ? "bg-green-400"
                            : result.overall_accuracy >= 50
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.min(result.overall_accuracy, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 text-xs text-white/85">
                      <span>
                        {t.targetScore}: {result.target_score.toFixed(1)}%
                      </span>
                      <span className="text-red-300">
                        {t.faultPenalty}: -{result.fault_penalty.toFixed(1)}%
                      </span>
                    </div>
                    {!result.is_reliable && (
                      <p className="max-w-xs text-xs text-amber-200/95">
                        {t.lowReliability}
                      </p>
                    )}
                  </div>
                ) : !visibilityWarning ? (
                  <p className="overlay-panel px-4 py-3 text-sm text-white/95">
                    {t.waitingForData}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
                rulesOpen ? "translate-y-0" : "translate-y-[calc(100%-3rem)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setRulesOpen((o) => !o)}
                className="overlay-panel flex w-full items-center justify-between rounded-b-none border-b-0 px-4 py-3 text-left text-sm font-medium text-white"
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
              <div className="overlay-panel max-h-[min(40vh,320px)] space-y-2 overflow-y-auto rounded-t-none border-t-0 p-4">
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

            {error && (
              <div className="absolute left-4 right-4 top-24 z-[50] mx-auto max-w-lg rounded-xl border border-red-400/45 bg-red-950/85 px-4 py-3 text-sm text-red-100 backdrop-blur-md">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
