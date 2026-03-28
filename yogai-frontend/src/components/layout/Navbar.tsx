"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthContext } from "@/components/layout/AuthProvider";
import { useApp } from "@/components/layout/AppProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();
  const { locale, setLocale, theme, toggleTheme, t } = useApp();

  const navLinks = [
    { href: "/dashboard", label: t.dashboard },
    { href: "/create-plan", label: t.createPlan },
    { href: "/pose-test", label: "Pose Test" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-th-border/50 bg-th-surface/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-400 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-th-text">YogAI</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-sage-400/10 text-sage-500 dark:text-sage-400"
                  : "text-th-text-mut hover:text-th-text hover:bg-th-subtle"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-3 ml-1">
              <Link
                href="/profile"
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  pathname === "/profile"
                    ? "bg-sage-400 text-white ring-2 ring-sage-400/30"
                    : "bg-sage-400/10 text-sage-500 dark:text-sage-400 hover:bg-sage-400/20"
                }`}
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
              <button
                onClick={signOut}
                className="text-sm font-medium text-th-text-mut transition-colors hover:text-th-text"
              >
                {t.signOut}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
