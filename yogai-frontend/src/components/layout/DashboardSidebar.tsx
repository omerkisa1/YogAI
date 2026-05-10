"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/layout/AppProvider";
import { DASHBOARD_NAV, isNavActive } from "@/components/layout/navItems";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-th-border bg-th-surface/90 px-3 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-400 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-th-text">YogAI</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {DASHBOARD_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const label = t[item.labelKey];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sage-400/15 text-sage-600 dark:text-sage-400"
                  : "text-th-text-mut hover:bg-th-subtle hover:text-th-text"
              }`}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
