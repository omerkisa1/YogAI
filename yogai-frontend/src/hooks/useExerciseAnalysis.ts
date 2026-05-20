"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  createFaceRepCounter,
  type FaceRepResult,
} from "@/lib/faceRepCounter";
import {
  createFaceHandRepCounter,
  type FaceHandRepResult,
} from "@/lib/faceHandRepCounter";
import {
  resolveExerciseAnalysisKind,
  type ExerciseAnalysisKind,
} from "@/lib/poseDomain";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useHandLandmarker } from "@/hooks/useHandLandmarker";
import { MEDIAPIPE_CAM_H, MEDIAPIPE_CAM_W } from "@/hooks/useMediapipePoseCamera";
export type { ExerciseAnalysisKind };
export { resolveExerciseAnalysisKind };

type Params = {
  poseId: string;
  analysisKind: ExerciseAnalysisKind;
  repTarget?: number;
  active: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function useExerciseAnalysis({
  poseId,
  analysisKind,
  repTarget,
  active,
  videoRef,
}: Params) {
  const isFace = analysisKind === "face";
  const isFaceHand = analysisKind === "face_hand";
  const isFaceMode = isFace || isFaceHand;

  const faceLandmarker = useFaceLandmarker();
  const handLandmarker = useHandLandmarker();
  const {
    start: startFaceLandmarker,
    stop: stopFaceLandmarker,
    currentFrame: faceFrame,
    fps: faceFps,
    isLoading: faceLmLoading,
    error: faceLmError,
  } = faceLandmarker;
  const {
    start: startHandLandmarker,
    stop: stopHandLandmarker,
    currentFrame: handFrame,
    isLoading: handLmLoading,
    error: handLmError,
  } = handLandmarker;

  const faceRepCounterRef = useRef<ReturnType<typeof createFaceRepCounter>>(null);
  const faceHandRepCounterRef = useRef<ReturnType<typeof createFaceHandRepCounter>>(null);
  const [faceRepResult, setFaceRepResult] = useState<FaceRepResult | null>(null);
  const [faceHandRepResult, setFaceHandRepResult] = useState<FaceHandRepResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const effectiveRepTarget =
    repTarget && repTarget > 0
      ? repTarget
      : isFace
        ? faceRepResult?.target
        : faceHandRepResult?.target;

  useEffect(() => {
    if (!poseId || !isFaceMode) {
      faceRepCounterRef.current = null;
      faceHandRepCounterRef.current = null;
      setFaceRepResult(null);
      setFaceHandRepResult(null);
      return;
    }
    const target = repTarget && repTarget > 0 ? repTarget : undefined;
    if (isFace) {
      const counter = createFaceRepCounter(poseId, target);
      faceRepCounterRef.current = counter;
      setFaceRepResult(counter ? counter.update(new Map()) : null);
      faceHandRepCounterRef.current = null;
      setFaceHandRepResult(null);
    } else {
      faceRepCounterRef.current = null;
      setFaceRepResult(null);
      const counter = createFaceHandRepCounter(poseId, target);
      faceHandRepCounterRef.current = counter;
      setFaceHandRepResult(counter ? counter.update([], [], new Map()) : null);
    }
  }, [poseId, analysisKind, repTarget, isFace, isFaceMode]);

  useEffect(() => {
    if (!active || !isFaceMode) {
      setCameraReady(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: MEDIAPIPE_CAM_W },
            height: { ideal: MEDIAPIPE_CAM_H },
            facingMode: "user",
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
        setCameraReady(true);
      } catch {
        setCameraReady(false);
      }
    })();
    return () => {
      cancelled = true;
      setCameraReady(false);
      stream?.getTracks().forEach((tr) => tr.stop());
      const el = videoRef.current;
      if (el) el.srcObject = null;
    };
  }, [active, isFaceMode, poseId, videoRef]);

  useEffect(() => {
    if (!active || !isFaceMode || !cameraReady) return;
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
  }, [active, isFaceMode, cameraReady, poseId, startFaceLandmarker, stopFaceLandmarker, videoRef]);

  useEffect(() => {
    if (!active || !isFaceHand || !cameraReady) return;
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    const onReady = () => {
      if (!cancelled && v.videoWidth) startHandLandmarker(v);
    };
    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onReady();
    else v.addEventListener("loadeddata", onReady);
    return () => {
      cancelled = true;
      v.removeEventListener("loadeddata", onReady);
      stopHandLandmarker();
    };
  }, [
    active,
    isFaceHand,
    cameraReady,
    poseId,
    startHandLandmarker,
    stopHandLandmarker,
    videoRef,
  ]);

  useEffect(() => {
    if (!isFace || !faceFrame || !faceRepCounterRef.current) return;
    if (!faceFrame.faceDetected || faceFrame.blendshapes.size === 0) return;
    const r = faceRepCounterRef.current.update(
      faceFrame.blendshapes,
      faceFrame.faceLandmarks ?? undefined,
    );
    setFaceRepResult(r);
  }, [isFace, faceFrame]);

  useEffect(() => {
    if (!isFaceHand || !faceHandRepCounterRef.current) return;
    const lms = faceFrame?.faceLandmarks ?? [];
    const handsPayload = (handFrame?.hands ?? []).map((h) => ({ landmarks: h.landmarks }));
    const r = faceHandRepCounterRef.current.update(
      handsPayload,
      lms,
      faceFrame?.blendshapes,
    );
    setFaceHandRepResult(r);
  }, [isFaceHand, faceFrame, handFrame]);

  const repResult = isFace ? faceRepResult : isFaceHand ? faceHandRepResult : null;

  const repAccuracy = useCallback((): number => {
    if (!repResult) return 0;
    const target = repResult.target || effectiveRepTarget || 1;
    return Math.min(100, Math.round((repResult.reps / target) * 100));
  }, [repResult, effectiveRepTarget]);

  const isRepComplete = repResult?.isComplete ?? false;
  const faceNotDetected = isFaceMode && !!faceFrame && !faceFrame.faceDetected;
  const pipelineLoading = faceLmLoading || (isFaceHand && handLmLoading);
  const pipelineError = faceLmError ?? (isFaceHand ? handLmError : null);

  return {
    isFaceMode,
    isFaceHand,
    isFace,
    faceRepResult,
    faceHandRepResult,
    repResult,
    faceFps,
    faceFrame,
    cameraReady,
    pipelineLoading,
    pipelineError,
    faceNotDetected,
    repAccuracy,
    isRepComplete,
    effectiveRepTarget: effectiveRepTarget ?? repResult?.target ?? 0,
  };
}
