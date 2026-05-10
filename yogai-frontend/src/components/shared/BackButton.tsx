"use client";

import { ArrowLeft } from "lucide-react";

type Props = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function BackButton({ onClick, children, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-sage-600 hover:underline dark:text-sage-400 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </button>
  );
}
