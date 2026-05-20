"use client";

import { useApp } from "@/components/layout/AppProvider";

type Props = {
  targetReps: number;
  countdown: number | null;
  onRetry?: () => void;
};

export function FaceYogaCompletionOverlay({ targetReps, countdown, onRetry }: Props) {
  const { t } = useApp();

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="overlay-panel flex max-w-sm flex-col items-center p-8 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <div className="text-2xl font-bold text-white">{t.congratulations}</div>
        <div className="mt-2 text-white/60">
          {targetReps} {t.repsCompleted}
        </div>
        {countdown !== null && (
          <>
            <div className="mt-4 text-5xl font-bold text-green-400">{countdown}</div>
            <div className="mt-1 text-sm text-white/40">{t.nextPoseIn}</div>
          </>
        )}
        {onRetry && countdown === null && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 rounded-xl bg-green-500 px-6 py-2 font-medium text-white"
          >
            {t.tryAgain}
          </button>
        )}
      </div>
    </div>
  );
}
