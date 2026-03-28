"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

// Fallback to avoid SSR issues with MediaPipe
type AnalyzablePose = {
  pose_id: string;
  name_en: string;
  name_tr: string;
};

type RuleResult = {
  joint: string;
  expected_range: number[];
  actual_angle: number;
  score: number;
  status: string;
  feedback_en?: string;
  feedback_tr?: string;
};

type AnalysisResponse = {
  pose_id: string;
  overall_accuracy: number;
  rules: RuleResult[];
  feedback_en?: string;
  feedback_tr?: string;
};

export default function PoseTestPage() {
  const [poses, setPoses] = useState<AnalyzablePose[]>([]);
  const [selectedPose, setSelectedPose] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Fetch analyzable poses on mount
    api.get("/api/v1/yoga/poses/analyzable")
      .then((res: any) => {
        if (res.data) setPoses(res.data);
      })
      .catch((err) => console.error("Failed to load poses:", err));
  }, []);

  useEffect(() => {
    if (!isAnalyzing || !selectedPose) return;

    let pose: any;
    let camera: any;
    let isMounted = true;
    let lastAnalyzeTime = 0;

    const setupMediaPipe = async () => {
      // Dynamically import mediapipe to avoid SSR issues
      const { Pose, POSE_CONNECTIONS } = await import("@mediapipe/pose");
      const { Camera } = await import("@mediapipe/camera_utils");
      const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

      if (!isMounted) return;

      pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(async (results: any) => {
        if (!isMounted) return;

        // Draw overlay
        const canvasCtx = canvasRef.current?.getContext("2d");
        if (canvasCtx && canvasRef.current && videoRef.current) {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          if (results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 4,
            });
            drawLandmarks(canvasCtx, results.poseLandmarks, {
              color: "#FF0000",
              lineWidth: 2,
            });
          }
          canvasCtx.restore();
        }

        // Throttle API calls to every 500ms
        const now = Date.now();
        if (results.poseLandmarks && now - lastAnalyzeTime > 500) {
          lastAnalyzeTime = now;
          const landmarks = results.poseLandmarks.map((lm: any, idx: number) => ({
            index: idx,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 0,
          }));

          try {
            const res = await api.post("/api/v1/yoga/analyze", {
              pose_id: selectedPose,
              landmarks: landmarks,
            });
            if (res.data) {
              setResult(res.data);
            }
          } catch (error) {
            console.error("Analysis failed:", error);
          }
        }
      });

      if (videoRef.current) {
        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    };

    setupMediaPipe();

    return () => {
      isMounted = false;
      if (camera) camera.stop();
      if (pose) pose.close();
    };
  }, [isAnalyzing, selectedPose]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Webcam Pose Analysis Test</h1>
      
      <div className="mb-6 flex gap-4 items-center">
        <select 
          className="p-2 border rounded"
          value={selectedPose}
          onChange={(e) => setSelectedPose(e.target.value)}
          disabled={isAnalyzing}
        >
          <option value="">-- Select a Pose to Analyze --</option>
          {poses.map(p => (
            <option key={p.pose_id} value={p.pose_id}>
              {p.name_en} / {p.name_tr}
            </option>
          ))}
        </select>

        {!isAnalyzing ? (
          <button 
            onClick={() => setIsAnalyzing(true)}
            disabled={!selectedPose}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Start Analysis
          </button>
        ) : (
          <button 
            onClick={() => {
              setIsAnalyzing(false);
              setResult(null);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Stop Analysis
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WEBCAM PANEL */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} className="hidden" playsInline muted></video>
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover"
            width={640}
            height={480}
          />
          {!isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              Webcam feed will appear here
            </div>
          )}
        </div>

        {/* RESULTS PANEL */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          
          {!result ? (
            <div className="text-slate-500 italic">Waiting for analysis data...</div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="text-sm text-slate-500">Overall Accuracy</div>
                <div className="text-4xl font-bold">
                  {result.overall_accuracy.toFixed(1)}%
                </div>
                {result.feedback_en && (
                  <div className="mt-2 p-3 bg-amber-50 text-amber-800 rounded border border-amber-200">
                    💬 {result.feedback_en}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Rule Breakdown</h3>
                {result.rules && result.rules.length > 0 ? (
                  result.rules.map((r, idx) => (
                    <div key={idx} className="flex flex-col text-sm border p-3 rounded bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize">{r.joint.replace("_", " ")}</span>
                        <span className={r.score >= 90 ? "text-green-600" : (r.score >= 60 ? "text-amber-600" : "text-red-600")}>
                          {r.score.toFixed(1)}% ({r.status})
                        </span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        Angle: {r.actual_angle.toFixed(1)}° (Expected: {r.expected_range[0]}-{r.expected_range[1]}°)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-sm">
                    No specific rules defined for this pose yet, or landmarks are not fully visible.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
