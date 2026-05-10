"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { colors } from "@/lib/colors";

/** Match pose-test capture resolution for stable MediaPipe camera behaviour. */
export const MEDIAPIPE_CAM_W = 2560;
export const MEDIAPIPE_CAM_H = 1440;

export type MediapipeLandmarkFrame = {
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null;
  t: number;
};

type Options = {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  modelComplexity?: 0 | 1 | 2;
  /** Bump to recreate MediaPipe when pose/session changes while staying active. */
  restartKey?: string | number;
  onFrame?: (frame: MediapipeLandmarkFrame) => void;
  onModelLoadError?: () => void;
  analyzeIntervalMs?: number;
};

export function useMediapipePoseCamera({
  active,
  containerRef,
  videoRef,
  canvasRef,
  modelComplexity = 0,
  restartKey = 0,
  onFrame,
  onModelLoadError,
  analyzeIntervalMs = 100,
}: Options) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const lastAnalyzeTime = useRef(0);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!active) {
      setDims({ w: 0, h: 0 });
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      setDims({
        w: Math.max(2, Math.floor(rect.width * dpr)),
        h: Math.max(2, Math.floor(rect.height * dpr)),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, containerRef]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || dims.w < 2 || dims.h < 2) return;
    c.width = dims.w;
    c.height = dims.h;
  }, [dims, canvasRef]);

  useEffect(() => {
    if (!active) {
      setFps(0);
      frameCount.current = 0;
      return;
    }

    let pose: { close: () => void } | undefined;
    let camera: { stop: () => void } | undefined;
    let isMounted = true;

    const setup = async () => {
      try {
        const { Pose, POSE_CONNECTIONS } = await import("@mediapipe/pose");
        const { Camera } = await import("@mediapipe/camera_utils");
        const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

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
            poseLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }>;
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

            const interval = analyzeIntervalMs;
            if (now - lastAnalyzeTime.current > interval) {
              lastAnalyzeTime.current = now;
              if (results.poseLandmarks) {
                onFrameRef.current?.({
                  landmarks: results.poseLandmarks.map((lm) => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z,
                    visibility: lm.visibility ?? 0,
                  })),
                  t: now,
                });
              } else {
                onFrameRef.current?.({ landmarks: null, t: now });
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
            width: MEDIAPIPE_CAM_W,
            height: MEDIAPIPE_CAM_H,
          });
          camera = cam;
          cam.start();
        }
      } catch {
        if (isMounted) {
          onModelLoadError?.();
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (camera?.stop) camera.stop();
      if (pose) {
        setTimeout(() => {
          try {
            pose?.close();
          } catch {
          }
        }, 100);
      }
    };
  }, [
    active,
    modelComplexity,
    restartKey,
    analyzeIntervalMs,
    videoRef,
    canvasRef,
    onModelLoadError,
  ]);

  return { fps, dims };
}
