"use client";

import { type RefObject } from "react";
import {
  resolveExerciseAnalysisKind,
  type ExerciseAnalysisKind,
} from "@/lib/poseDomain";
import { useFaceYogaPipeline } from "@/hooks/useFaceYogaPipeline";

export type { ExerciseAnalysisKind };
export { resolveExerciseAnalysisKind };

type Params = {
  poseId: string;
  analysisKind: ExerciseAnalysisKind;
  repTarget?: number;
  active: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraReady: boolean;
};

export function useExerciseAnalysis({
  poseId,
  analysisKind,
  repTarget,
  active,
  videoRef,
  cameraReady,
}: Params) {
  const pipeline = useFaceYogaPipeline({
    poseId,
    analysisKind,
    repTarget,
    active,
    videoRef,
    cameraReady,
  });

  return {
    ...pipeline,
    cameraReady,
    faceNotDetected: pipeline.isFaceMode && !!pipeline.faceFrame && !pipeline.faceDetected,
    effectiveRepTarget: pipeline.repResult?.target ?? repTarget ?? 0,
    faceLmLoading: pipeline.faceLmLoading,
    handLmLoading: pipeline.handLmLoading,
  };
}
