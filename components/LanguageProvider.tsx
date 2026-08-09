"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Language, translations } from "../lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: (typeof translations)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("koha-language") as Language | null;
    const initialLanguage = saved === "vi" || saved === "en" ? saved : "vi";
    document.documentElement.lang = initialLanguage;
    const savedTheme = window.localStorage.getItem("koha-theme");
    const initialTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = initialTheme;
    const timer = window.setTimeout(() => {
      setLanguageState(initialLanguage);
      setTheme(initialTheme);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("koha-language", next);
    document.documentElement.lang = next;
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("koha-theme", next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  };

  const value = useMemo(
    () => ({ language, setLanguage, theme, toggleTheme, t: translations[language] }),
    [language, theme],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
