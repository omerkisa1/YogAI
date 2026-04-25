"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import { useAnalyzePose } from "@/hooks/useYoga";
import type { AnalyzablePose, AnalyzeResponse } from "@/types/yoga";
import api from "@/lib/axios";

export default function PoseTestPage() {
  const { t, locale } = useApp();
  const { analyzePose } = useAnalyzePose();
  const [poses, setPoses] = useState<AnalyzablePose[]>([]);
  const [selectedPose, setSelectedPose] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api
      .get("/api/v1/yoga/poses/analyzable")
      .then((res: { data?: AnalyzablePose[] }) => {
        if (res.data) setPoses(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAnalyzing || !selectedPose) return;

    let pose: unknown;
    let camera: unknown;
    let isMounted = true;
    let lastAnalyzeTime = 0;

    const setup = async () => {
      const { Pose, POSE_CONNECTIONS } = await import("@mediapipe/pose");
      const { Camera } = await import("@mediapipe/camera_utils");
      const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

      if (!isMounted) return;

      const poseInstance = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose = poseInstance;

      poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseInstance.onResults(async (results: { image: CanvasImageSource; poseLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }> }) => {
        if (!isMounted) return;

        const canvasCtx = canvasRef.current?.getContext("2d");
        if (canvasCtx && canvasRef.current) {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          if (results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#6BAE6C", lineWidth: 3 });
            drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#C4956A", lineWidth: 2 });
          }
          canvasCtx.restore();
        }

        const now = Date.now();
        if (results.poseLandmarks && now - lastAnalyzeTime > 500) {
          lastAnalyzeTime = now;
          const landmarks = results.poseLandmarks.map((lm, idx) => ({
            index: idx,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 0,
          }));
          try {
            const data = await analyzePose({ pose_id: selectedPose, landmarks });
            if (data) setResult(data);
          } catch {
            //
          }
        }
      });

      if (videoRef.current) {
        const cam = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && isMounted) {
              try {
                await poseInstance.send({ image: videoRef.current });
              } catch {
                //
              }
            }
          },
          width: 640,
          height: 480,
        });
        camera = cam;
        cam.start();
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (camera && typeof (camera as { stop?: () => void }).stop === "function") {
        (camera as { stop: () => void }).stop();
      }
      if (pose) {
        setTimeout(() => {
          try {
            (pose as { close: () => void }).close();
          } catch {
            //
          }
        }, 100);
      }
    };
  }, [isAnalyzing, selectedPose, analyzePose]);

  const feedback = locale === "tr" ? result?.feedback_tr : result?.feedback_en;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-th-text">{t.poseTest}</h1>
        <p className="mt-1 text-sm text-th-text-mut">{t.poseTestSubtitle}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          className="input-field max-w-xs"
          value={selectedPose}
          onChange={(e) => setSelectedPose(e.target.value)}
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
            disabled={!selectedPose}
            className="btn-primary"
          >
            {t.startAnalysis}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsAnalyzing(false); setResult(null); }}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            {t.stopAnalysis}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-th-subtle" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="h-full w-full object-cover" width={640} height={480} />
          {!isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-th-text-mut">{t.webcamFeed}</p>
            </div>
          )}
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-th-text">{t.overallAccuracy}</h2>

          {!result ? (
            <p className="text-sm italic text-th-text-mut">{t.waitingForData}</p>
          ) : (
            <>
              <div>
                <p className="text-5xl font-bold text-th-text">{result.overall_accuracy.toFixed(1)}%</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-xl bg-sage-50/60 dark:bg-sage-900/20 px-3 py-1.5 text-sage-600 dark:text-sage-400">
                    {t.targetScore}: {result.target_score?.toFixed(1) || "100.0"}%
                  </span>
                  <span className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-red-500 dark:text-red-400">
                    {t.faultPenalty}: -{result.fault_penalty?.toFixed(1) || "0.0"}%
                  </span>
                </div>
                {feedback && (
                  <div className="mt-3 rounded-xl border border-clay-200 dark:border-clay-700/30 bg-clay-50/60 dark:bg-clay-900/15 px-4 py-3 text-sm text-th-text-sec">
                    {feedback}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-th-text border-b border-th-border pb-2">{t.ruleBreakdown}</h3>
                {!result.rules || result.rules.length === 0 ? (
                  <p className="text-sm italic text-th-text-mut">{t.noRulesDefined}</p>
                ) : (
                  result.rules.map((r, i) => {
                    const isFault = r.rule_type === "fault";
                    const isProblematic = isFault && r.triggered;
                    const ruleFeedback = locale === "tr" ? r.feedback_tr : r.feedback_en;
                    return (
                      <div
                        key={i}
                        className={`rounded-xl border p-3 text-sm transition-colors ${
                          isProblematic
                            ? "border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/15"
                            : "border-th-border bg-th-surface"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize text-th-text">
                            {r.joint.replace(/_/g, " ")} ({isFault ? t.faultLabel : t.targetLabel})
                          </span>
                          {!isFault ? (
                            <span className={`font-semibold ${(r.score ?? 0) >= 90 ? "text-green-600 dark:text-green-400" : (r.score ?? 0) >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                              {r.score?.toFixed(1)}%
                            </span>
                          ) : (
                            <span className={r.triggered ? "font-bold text-red-500" : "text-th-text-mut"}>
                              {r.triggered ? `-${r.penalty?.toFixed(1)}%` : t.noFault}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-th-text-mut">
                          {t.angleRange}: {r.actual_angle?.toFixed(1)}° · {t.expected}: {r.expected_range[0]}–{r.expected_range[1]}°
                        </p>
                        {ruleFeedback && (
                          <p className="mt-1 text-xs text-th-text-sec">{ruleFeedback}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
