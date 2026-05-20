"use client";

type Props = {
  value: number;
  enterThreshold: number;
  label: string;
  minLabel?: string;
  maxLabel?: string;
};

export function ExerciseBar({
  value,
  enterThreshold,
  label,
  minLabel = "0",
  maxLabel = "MAX",
}: Props) {
  const thresholdPercent = enterThreshold * 100;
  const isAboveThreshold = value >= enterThreshold;

  return (
    <div className="overlay-panel w-64 p-4">
      <div className="mb-1 text-xs text-white/60">{label}</div>
      <div className="relative h-3 w-full rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${isAboveThreshold ? "bg-green-400" : "bg-amber-400"}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-white/60"
          style={{ left: `${thresholdPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-white/40">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
