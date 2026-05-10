"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useApp } from "@/components/layout/AppProvider";
import { DASHBOARD_NAV, isNavActive } from "@/components/layout/navItems";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();
  const { locale, setLocale, theme, toggleTheme, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderLinks = (onNavigate?: () => void) =>
    DASHBOARD_NAV.map((item) => {
      const active = isNavActive(pathname, item.href);
      const label = t[item.labelKey];
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => onNavigate?.()}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
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
    });

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b border-th-border/50 bg-th-surface/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6 lg:max-w-none">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-th-subtle text-th-text md:hidden"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-400 text-white md:h-9 md:w-9">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <span className="truncate text-base font-semibold text-th-text md:text-lg">YogAI</span>
            </Link>
          </div>

          <div className="hidden md:flex lg:hidden flex-1 items-center justify-center gap-1 overflow-x-auto px-2">
            {DASHBOARD_NAV.map((item) => {
              const active = isNavActive(pathname, item.href);
              const label = t[item.labelKey];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                    active
                      ? "bg-sage-400/10 text-sage-500 dark:text-sage-400"
                      : "text-th-text-mut hover:bg-th-subtle hover:text-th-text"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:block lg:flex-1" aria-hidden />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "tr" : "en")}
              className="flex h-8 items-center justify-center rounded-lg bg-th-subtle px-2.5 text-xs font-semibold text-th-text-sec transition-colors hover:bg-th-muted"
            >
              {locale === "en" ? "TR" : "EN"}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-subtle text-th-text-sec transition-colors hover:bg-th-muted"
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            {user && (
              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/profile"
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all md:text-sm ${
                    pathname === "/profile"
                      ? "bg-sage-400 text-white ring-2 ring-sage-400/30"
                      : "bg-sage-400/10 text-sage-500 dark:text-sage-400 hover:bg-sage-400/20"
                  }`}
                >
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="hidden text-xs font-medium text-th-text-mut transition-colors hover:text-th-text sm:inline md:text-sm"
                >
                  {t.signOut}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-[min(100%,280px)] flex-col bg-th-surface p-4 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-semibold text-th-text">YogAI</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-th-text-mut hover:bg-th-subtle"
                  aria-label={t.close}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1">{renderLinks(() => setMobileOpen(false))}</nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
