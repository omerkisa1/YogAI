const DEFAULT_SAMPLE_INTERVAL_MS = 100;

export function aggregateAccuracyFromSamples(
  samples: number[],
  fallback: number,
  windowSeconds = 5,
  sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL_MS,
): number {
  if (samples.length === 0) return fallback;
  const approxPerSec = 1000 / sampleIntervalMs;
  const cap = Math.ceil(windowSeconds * approxPerSec);
  const n = Math.min(samples.length, cap);
  const slice = samples.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export type AccuracyVisualTier = "none" | "low" | "mid" | "high";

export function getAccuracyVisualTier(accuracy: number): AccuracyVisualTier {
  const n = Math.round(Math.min(100, Math.max(0, Number.isFinite(accuracy) ? accuracy : 0)));
  if (n <= 0) return "none";
  if (n >= 80) return "high";
  if (n >= 50) return "mid";
  return "low";
}

const PROGRESS_BAR: Record<AccuracyVisualTier, string> = {
  none: "bg-th-text-mut/35 dark:bg-th-text-mut/50",
  low: "bg-red-500 dark:bg-red-400",
  mid: "bg-amber-500 dark:bg-amber-400",
  high: "bg-sage-500 dark:bg-sage-400",
};

const SCORE_TEXT: Record<AccuracyVisualTier, string> = {
  none: "text-th-text-mut",
  low: "text-red-600 dark:text-red-400",
  mid: "text-amber-600 dark:text-amber-400",
  high: "text-sage-600 dark:text-sage-400",
};

export function accuracyProgressBarClass(accuracy: number): string {
  return PROGRESS_BAR[getAccuracyVisualTier(accuracy)];
}

export function accuracyScoreTextClass(accuracy: number): string {
  return SCORE_TEXT[getAccuracyVisualTier(accuracy)];
}

export function formatDurationSeconds(
  totalSec: number,
  minutesShort: string,
  secondsShort: string,
): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}${secondsShort}`;
  if (s === 0) return `${m}${minutesShort}`;
  return `${m}${minutesShort} ${s}${secondsShort}`;
}
