"use client";

import { useApp } from "@/components/layout/AppProvider";

export default function Footer() {
  const { locale } = useApp();
  return (
    <footer className="border-t border-th-border/50 bg-th-surface/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-6">
        <p className="text-xs text-th-text-mut">
          &copy; {new Date().getFullYear()} YogAI &mdash;{" "}
          {locale === "tr" ? "Tüm hakları saklıdır" : "All rights reserved"}
        </p>
      </div>
    </footer>
  );
}
