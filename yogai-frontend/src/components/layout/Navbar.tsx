"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthContext } from "@/components/layout/AuthProvider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create-plan", label: "Create Plan" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-cream-300/50 bg-cream-50/80 backdrop-blur-xl"
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
          <span className="text-lg font-semibold text-charcoal">YogAI</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-sage-400/10 text-sage-500"
                  : "text-charcoal-lighter hover:text-charcoal hover:bg-cream-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-400/10 text-sm font-medium text-sage-500">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <button
                onClick={signOut}
                className="text-sm font-medium text-charcoal-lighter transition-colors hover:text-charcoal"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
