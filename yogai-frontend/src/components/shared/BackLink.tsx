import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function BackLink({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700 hover:underline dark:text-sage-400 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </Link>
  );
}
