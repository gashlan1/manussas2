import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (ar: string, en: string) => string;
  dir: "rtl" | "ltr";
  isArabic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("aglc-lang");
    return (stored as Language) || "ar";
  });

  useEffect(() => {
    localStorage.setItem("aglc-lang", language);
    const root = document.documentElement;
    if (language === "ar") {
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", "ar");
      document.body.style.direction = "rtl";
      document.body.style.textAlign = "right";
    } else {
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", "en");
      document.body.style.direction = "ltr";
      document.body.style.textAlign = "left";
    }
  }, [language]);

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const dir = language === "ar" ? "rtl" : "ltr";
  const isArabic = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isArabic }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
