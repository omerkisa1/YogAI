"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale, Translations } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

interface AppContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: Translations;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLocale = localStorage.getItem("yogai-locale") as Locale | null;
    const storedTheme = localStorage.getItem("yogai-theme") as "light" | "dark" | null;
    if (storedLocale === "tr" || storedLocale === "en") setLocaleState(storedLocale);
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("yogai-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    localStorage.setItem("yogai-locale", locale);
  }, [locale, mounted]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const t = getTranslations(locale);

  return (
    <AppContext.Provider value={{ locale, setLocale, theme, toggleTheme, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
