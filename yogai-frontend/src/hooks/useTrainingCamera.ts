"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { MEDIAPIPE_CAM_H, MEDIAPIPE_CAM_W } from "@/hooks/useMediapipePoseCamera";

type Params = {
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function useTrainingCamera({ enabled, videoRef }: Params) {
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const releaseCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    const el = videoRef.current;
    if (el) el.srcObject = null;
    setCameraReady(false);
  }, [videoRef]);

  const ensureCamera = useCallback(async () => {
    if (streamRef.current && videoRef.current?.srcObject) {
      setCameraReady(true);
      setCameraError(false);
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: MEDIAPIPE_CAM_W },
          height: { ideal: MEDIAPIPE_CAM_H },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      const el = videoRef.current;
      if (!el) {
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        setCameraReady(false);
        return false;
      }
      el.srcObject = stream;
      await el.play().catch(() => {});
      setCameraReady(true);
      setCameraError(false);
      return true;
    } catch {
      setCameraReady(false);
      setCameraError(true);
      return false;
    }
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) {
      releaseCamera();
      setCameraError(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await ensureCamera();
      if (cancelled && ok && streamRef.current) {
        releaseCamera();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, ensureCamera, releaseCamera]);

  return { cameraReady, cameraError, ensureCamera, releaseCamera };
}
