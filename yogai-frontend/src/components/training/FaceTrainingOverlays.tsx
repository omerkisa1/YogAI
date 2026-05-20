"use client";

import { useApp } from "@/components/layout/AppProvider";
import FaceFeedbackBanner from "@/components/yoga/FaceFeedbackBanner";
import type { FaceRepResult } from "@/lib/faceRepCounter";
import type { FaceHandRepResult } from "@/lib/faceHandRepCounter";
import type { ExerciseAnalysisKind } from "@/lib/poseDomain";
import type { Translations } from "@/lib/i18n";

type Props = {
  analysisKind: ExerciseAnalysisKind;
  faceRepResult: FaceRepResult | null;
  faceHandRepResult: FaceHandRepResult | null;
  repPulse: boolean;
  handRepPulse: boolean;
  faceEnterThreshold: number;
  pipelineLoading: boolean;
};

export function FaceTrainingOverlays({
  analysisKind,
  faceRepResult,
  faceHandRepResult,
  repPulse,
  handRepPulse,
  faceEnterThreshold,
  pipelineLoading,
}: Props) {
  const { t } = useApp();
  const isFace = analysisKind === "face";
  const isFaceHand = analysisKind === "face_hand";

  if (pipelineLoading) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/35">
        <p className="rounded-xl overlay-panel px-5 py-3 text-sm text-white">
          {t.waitingForData}
        </p>
      </div>
    );
  }

  if (isFace && faceRepResult) {
    return (
      <>
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 flex max-w-[min(100vw-2rem,20rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center p-6 overlay-panel">
          <div
            className={`text-5xl font-bold text-white transition-transform duration-200 ${
              repPulse ? "scale-125 text-green-400" : "scale-100"
            }`}
          >
            {faceRepResult.reps} / {faceRepResult.target}
          </div>
          <div className="mt-1 text-sm text-white/60">{t.reps}</div>
          <div className="mt-3 h-2 w-48 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-200"
              style={{ width: `${faceRepResult.progress * 100}%` }}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 p-4 overlay-panel">
          <div className="mb-1 text-xs text-white/60">
            {barLabel(t, faceRepResult.barLabelKey)}
          </div>
          <div className="relative h-3 w-full rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                faceRepResult.currentValue >= faceEnterThreshold
                  ? "bg-green-400"
                  : "bg-amber-400"
              }`}
              style={{
                width: `${Math.min(faceRepResult.currentValue * 100, 100)}%`,
              }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-white/60"
              style={{ left: `${faceEnterThreshold * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-white/40">
            <span>{t.closed}</span>
            <span>{t.open}</span>
          </div>
        </div>

        {!faceRepResult.isComplete && (
          <div className="pointer-events-none absolute right-4 top-20 z-20 max-w-xs px-5 py-3 overlay-panel">
            <FaceFeedbackBanner
              variant="face"
              feedbackState={faceRepResult.feedbackState}
              feedbackKey={faceRepResult.feedbackKey}
            />
          </div>
        )}
      </>
    );
  }

  if (isFaceHand && faceHandRepResult) {
    return (
      <>
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 flex max-w-[min(100vw-2rem,20rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center p-6 overlay-panel">
          <div
            className={`text-5xl font-bold text-white transition-transform duration-200 ${
              handRepPulse ? "scale-125 text-green-400" : "scale-100"
            }`}
          >
            {faceHandRepResult.reps} / {faceHandRepResult.target}
          </div>
          <div className="mt-1 text-sm text-white/60">{t.reps}</div>

          {faceHandRepResult.handNearFace && (
            <div className="mt-3 h-2 w-48 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{ width: `${faceHandRepResult.holdProgress * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 p-4 overlay-panel">
          <div className="mb-1 text-xs text-white/60">{t.handProximity}</div>
          <div className="h-3 w-full rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                faceHandRepResult.handNearFace ? "bg-green-400" : "bg-amber-400"
              }`}
              style={{
                width: `${Math.min(faceHandRepResult.currentProximity * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {!faceHandRepResult.isComplete && (
          <div className="pointer-events-none absolute right-4 top-20 z-20 max-w-xs px-5 py-3 overlay-panel">
            <FaceFeedbackBanner
              variant="face_hand"
              feedbackState={faceHandRepResult.feedbackState}
              feedbackKey={faceHandRepResult.feedbackKey}
            />
          </div>
        )}
      </>
    );
  }

  return null;
}

function barLabel(t: Translations, key: string): string {
  const v = t[key as keyof Translations];
  return typeof v === "string" ? v : key;
}
