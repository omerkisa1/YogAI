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
