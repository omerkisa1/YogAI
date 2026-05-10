import { Circle } from "lucide-react";

type Props = {
  value: number;
  max?: number;
  activeClassName?: string;
  inactiveClassName?: string;
};

export default function DifficultyDots({
  value,
  max = 5,
  activeClassName = "text-sage-500",
  inactiveClassName = "text-th-muted",
}: Props) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <Circle
          key={i}
          className={`h-2 w-2 ${i < value ? activeClassName : inactiveClassName}`}
          fill={i < value ? "currentColor" : "none"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}
