"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface HandFrame {
  hands: HandData[];
  timestamp: number;
}

export interface HandData {
  landmarks: { x: number; y: number; z: number }[];
  handedness: "Left" | "Right";
}

interface UseHandLandmarkerReturn {
  isLoading: boolean;
  error: string | null;
  isRunning: boolean;
  start: (videoElement: HTMLVideoElement) => void;
  stop: () => void;
  currentFrame: HandFrame | null;
}

export function useHandLandmarker(): UseHandLandmarkerReturn {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<HandFrame | null>(null);

  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      landmarkerRef.current = landmarker;
      setIsLoading(false);
      return landmarker;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "HandLandmarker yüklenemedi";
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

      const processFrame = () => {
        if (!landmarkerRef.current || !videoElement.videoWidth) {
          animFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const now = performance.now();
        const result = landmarkerRef.current.detectForVideo(videoElement, now);

        const hands: HandData[] = [];
        if (result.landmarks) {
          for (let i = 0; i < result.landmarks.length; i++) {
            const lm = result.landmarks[i];
            const cat = result.handedness?.[i]?.[0]?.categoryName ?? "Left";
            const mirrored: "Left" | "Right" = cat === "Left" ? "Right" : "Left";
            hands.push({
              landmarks: lm.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
              handedness: mirrored,
            });
          }
        }

        setCurrentFrame({
          hands,
          timestamp: now,
        });

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

  return { isLoading, error, isRunning, start, stop, currentFrame };
}
