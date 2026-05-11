"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface FaceFrame {
  blendshapes: Map<string, number>;
  faceLandmarks: { x: number; y: number; z: number }[] | null;
  timestamp: number;
  faceDetected: boolean;
}

interface UseFaceLandmarkerReturn {
  isLoading: boolean;
  error: string | null;
  isRunning: boolean;
  start: (videoElement: HTMLVideoElement) => void;
  stop: () => void;
  currentFrame: FaceFrame | null;
  fps: number;
}

export function useFaceLandmarker(): UseFaceLandmarkerReturn {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<FaceFrame | null>(null);
  const [fps, setFps] = useState(0);

  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });

      landmarkerRef.current = landmarker;
      setIsLoading(false);
      return landmarker;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "FaceLandmarker yüklenemedi";
      setError(msg);
      setIsLoading(false);
      return null;
    }
  }, []);

  const start = useCallback(
    async (videoElement: HTMLVideoElement) => {
      const landmarker = await initLandmarker();
      if (!landmarker) return;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }

      setIsRunning(true);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = performance.now();

      const processFrame = () => {
        if (!landmarkerRef.current || !videoElement.videoWidth) {
          animFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const now = performance.now();
        frameCountRef.current++;
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }

        const result = landmarkerRef.current.detectForVideo(videoElement, now);

        const landmarksRaw = result.faceLandmarks?.[0];
        const hasBlend = !!(result.faceBlendshapes && result.faceBlendshapes.length > 0);
        const hasLandmarks = !!(landmarksRaw && landmarksRaw.length > 0);

        if (hasBlend || hasLandmarks) {
          const map = new Map<string, number>();
          if (hasBlend) {
            const shapes = result.faceBlendshapes![0].categories;
            for (const s of shapes) {
              map.set(s.categoryName, s.score);
            }
          }
          setCurrentFrame({
            blendshapes: map,
            faceLandmarks: landmarksRaw
              ? landmarksRaw.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 }))
              : null,
            timestamp: now,
            faceDetected: hasBlend || hasLandmarks,
          });
        } else {
          setCurrentFrame({
            blendshapes: new Map(),
            faceLandmarks: null,
            timestamp: now,
            faceDetected: false,
          });
        }

        animFrameRef.current = requestAnimationFrame(processFrame);
      };

      animFrameRef.current = requestAnimationFrame(processFrame);
    },
    [initLandmarker],
  );

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setIsRunning(false);
    setFps(0);
    frameCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [stop]);

  return { isLoading, error, isRunning, start, stop, currentFrame, fps };
}
