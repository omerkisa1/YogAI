"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import api from "@/lib/axios";
import {
  analyzePoseClientSide,
  type LandmarkRule,
  type AnalyzeResult,
} from "@/lib/poseAnalyzer";
import type { AnalyzablePose } from "@/types/yoga";

type ModelComplexity = 0 | 1 | 2;

function accuracyColor(acc: number): string {
  if (acc >= 80) return "text-green-600 dark:text-green-400";
  if (acc >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function accuracyBarColor(acc: number): string {
  if (acc >= 80) return "bg-green-500";
  if (acc >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function ruleCardClass(r: AnalyzeResult["rules"][0]): string {
  const base = "rounded-xl p-3 text-sm transition-colors border";
  if (r.status === "low_visibility") {
    return `${base} border-th-border bg-th-surface`;
  }
  if (r.rule_type === "fault") {
    return r.triggered
      ? `${base} border-l-4 border-l-red-400 border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/15`
      : `${base} border-l-4 border-l-th-muted border-th-border bg-th-surface`;
  }
  if (r.score >= 90)
    return `${base} border-l-4 border-l-green-500 border-green-200 bg-green-50/60 dark:border-green-800/30 dark:bg-green-900/10`;
  if (r.score >= 60)
    return `${base} border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/60 dark:border-amber-800/30 dark:bg-amber-900/10`;
  return `${base} border-l-4 border-l-red-400 border-red-200 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10`;
}

export default function PoseTestPage() {
  const { t, locale } = useApp();

  const [poses, setPoses] = useState<AnalyzablePose[]>([]);
  const [selectedPose, setSelectedPose] = useState<string>("");
  const [selectedRules, setSelectedRules] = useState<LandmarkRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [fps, setFps] = useState(0);
  const [modelComplexity, setModelComplexity] = useState<ModelComplexity>(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs kept in sync so the MediaPipe onResults closure always reads fresh values
  const rulesRef = useRef<LandmarkRule[]>([]);
  const selectedPoseRef = useRef<string>("");
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const lastAnalyzeTime = useRef(0);

  useEffect(() => {
    rulesRef.current = selectedRules;
  }, [selectedRules]);

  useEffect(() => {
    selectedPoseRef.current = selectedPose;
  }, [selectedPose]);

  // Load analyzable pose list once on mount
  useEffect(() => {
    api
      .get("/api/v1/yoga/poses/analyzable")
      .then((res: { data?: AnalyzablePose[] }) => {
        if (res.data) setPoses(res.data);
      })
      .catch(() => {});
  }, []);

  // Load landmark rules whenever the selected pose changes
  useEffect(() => {
    if (!selectedPose) {
      setSelectedRules([]);
      return;
    }
    let cancelled = false;
    setRulesLoading(true);
    setError(null);
    api
      .get(`/api/v1/yoga/poses/${selectedPose}`)
      .then((res: { data?: { landmark_rules?: LandmarkRule[] } }) => {
        if (!cancelled) setSelectedRules(res.data?.landmark_rules ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            locale === "tr"
              ? "Bu poz için analiz kuralları yüklenemedi."
              : "Could not load analysis rules for this pose.",
          );
          setSelectedRules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPose, locale]);

  // MediaPipe lifecycle — restarts when analysis toggles or model complexity changes
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

            // FPS counter (updated once per second)
            frameCount.current++;
            const now = Date.now();
            if (now - lastFpsTime.current >= 1000) {
              setFps(frameCount.current);
              frameCount.current = 0;
              lastFpsTime.current = now;
            }

            // Canvas overlay drawn every frame → smooth video
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx && canvasRef.current) {
              ctx.save();
              ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height,
              );
              ctx.drawImage(
                results.image,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height,
              );
              if (results.poseLandmarks) {
                drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                  color: "#6BAE6C",
                  lineWidth: 3,
                });
                drawLandmarks(ctx, results.poseLandmarks, {
                  color: "#C4956A",
                  lineWidth: 2,
                });
              }
              ctx.restore();
            }

            // Throttled client-side analysis (no backend call)
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
                const analyzeStart = Date.now();
                const analyzeResult = analyzePoseClientSide(
                  selectedPoseRef.current,
                  rules,
                  landmarks,
                );
                if (process.env.NODE_ENV === "development") {
                  console.log(
                    `[PoseTest] Analyze took ${Date.now() - analyzeStart}ms`,
                  );
                }
                setResult(analyzeResult);
              }
            }
          },
        );

        if (videoRef.current) {
          const cam = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && isMounted) {
                try {
                  await poseInstance.send({ image: videoRef.current });
                } catch {
                  // ignore single-frame errors
                }
              }
            },
            width: 640,
            height: 480,
          });
          camera = cam;
          cam.start();
        }
      } catch {
        if (isMounted) {
          setError(
            locale === "tr"
              ? "Model yüklenemedi, sayfayı yenileyin."
              : "Model could not be loaded. Please refresh the page.",
          );
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
            // ignore
          }
        }, 100);
      }
    };
  }, [isAnalyzing, selectedPose, modelComplexity, locale]);

  const handleStop = () => {
    setIsAnalyzing(false);
    setResult(null);
    setFps(0);
    frameCount.current = 0;
  };

  const handlePoseChange = (poseId: string) => {
    if (isAnalyzing) handleStop();
    setSelectedPose(poseId);
    setError(null);
  };

  const handleModelChange = (c: ModelComplexity) => {
    setModelComplexity(c);
    // If currently analyzing, the useEffect will restart MediaPipe with new complexity
    if (isAnalyzing) {
      setResult(null);
      setFps(0);
      frameCount.current = 0;
    }
  };

  const modelLabels: Record<ModelComplexity, string> = {
    0: t.modelLite,
    1: t.modelFull,
    2: t.modelHeavy,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-th-text">{t.poseTest}</h1>
        <p className="mt-1 text-sm text-th-text-mut">{t.poseTestSubtitle}</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input-field max-w-xs"
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

          {!isAnalyzing ? (
            <button
              type="button"
              onClick={() => setIsAnalyzing(true)}
              disabled={!selectedPose || rulesLoading}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rulesLoading ? "…" : t.startAnalysis}
            </button>
          ) : (
            <button type="button" onClick={handleStop} className="btn-danger">
              {t.stopAnalysis}
            </button>
          )}
        </div>

        {/* Model complexity toggle */}
        <div className="flex items-center gap-2">
          {([0, 1, 2] as ModelComplexity[]).map((c) => (
            <button
              key={c}
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleModelChange(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
                modelComplexity === c
                  ? "bg-sage-400 text-white dark:bg-sage-500"
                  : "border border-th-border bg-th-card text-th-text-sec hover:bg-th-subtle"
              }`}
            >
              {modelLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Inline error banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800/30 dark:bg-red-900/15 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main grid: camera left, score panel right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Camera / canvas panel */}
        <div
          className="relative overflow-hidden rounded-2xl bg-th-subtle"
          style={{ aspectRatio: "4/3" }}
        >
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas
            ref={canvasRef}
            className="h-full w-full object-cover"
            width={640}
            height={480}
          />
          {!isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-th-text-mut">{t.webcamFeed}</p>
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {t.fpsLabel}: {fps}
            </div>
          )}
        </div>

        {/* Score panel */}
        <div className="card space-y-4 overflow-hidden">
          <h2 className="text-lg font-semibold text-th-text">
            {t.overallAccuracy}
          </h2>

          {!result ? (
            <p className="text-sm italic text-th-text-mut">{t.waitingForData}</p>
          ) : (
            <>
              {/* Big accuracy number + progress bar */}
              <div>
                <p
                  className={`text-5xl font-bold ${accuracyColor(result.overall_accuracy)}`}
                >
                  {result.overall_accuracy.toFixed(1)}%
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-th-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${accuracyBarColor(result.overall_accuracy)}`}
                    style={{
                      width: `${Math.min(result.overall_accuracy, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Target / fault badges */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-xl bg-sage-50/60 px-3 py-1.5 text-sage-600 dark:bg-sage-900/20 dark:text-sage-400">
                  {t.targetScore}: {result.target_score.toFixed(1)}%
                </span>
                <span className="rounded-xl bg-red-50 px-3 py-1.5 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {t.faultPenalty}: -{result.fault_penalty.toFixed(1)}%
                </span>
              </div>

              {/* Rule breakdown */}
              <div className="space-y-2">
                <h3 className="border-b border-th-border pb-2 text-sm font-semibold text-th-text">
                  {t.ruleBreakdown}
                </h3>
                {result.rules.length === 0 ? (
                  <p className="text-sm italic text-th-text-mut">
                    {t.noRulesDefined}
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {result.rules.map((r, i) => {
                      const isFault = r.rule_type === "fault";
                      const isLowVis = r.status === "low_visibility";
                      const ruleFeedback =
                        locale === "tr" ? r.feedback_tr : r.feedback_en;
                      return (
                        <div key={i} className={ruleCardClass(r)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium capitalize text-th-text">
                              {r.joint.replace(/_/g, " ")}
                              <span className="ml-1.5 text-xs font-normal text-th-text-mut">
                                ({isFault ? t.faultLabel : t.targetLabel})
                              </span>
                            </span>
                            {isLowVis ? (
                              <span className="shrink-0 text-xs text-th-text-mut">
                                {t.lowVisibility}
                              </span>
                            ) : !isFault ? (
                              <span
                                className={`shrink-0 font-semibold ${accuracyColor(r.score)}`}
                              >
                                {r.score.toFixed(1)}%
                              </span>
                            ) : (
                              <span
                                className={
                                  r.triggered
                                    ? "shrink-0 font-bold text-red-500 dark:text-red-400"
                                    : "shrink-0 text-th-text-mut"
                                }
                              >
                                {r.triggered
                                  ? `-${r.penalty.toFixed(1)}%`
                                  : t.noFault}
                              </span>
                            )}
                          </div>
                          {!isLowVis && (
                            <p className="mt-1 text-xs text-th-text-mut">
                              {t.angleRange}: {r.actual_angle.toFixed(1)}° ·{" "}
                              {t.expected}: {r.expected_range[0]}–
                              {r.expected_range[1]}°
                            </p>
                          )}
                          {!isLowVis && ruleFeedback && (
                            <p className="mt-1 text-xs text-th-text-sec">
                              {ruleFeedback}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
