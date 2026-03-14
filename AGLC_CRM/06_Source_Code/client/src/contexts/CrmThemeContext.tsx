import React, { createContext, useContext, useEffect, useState } from "react";

export type CrmTheme =
  | "classic-normal"    // Default: Black-dominant with gold accents
  | "classic-light"     // White-dominant with gold accents
  | "neon-dark"         // Void/Neon dark
  | "neon-light"        // Lavender-white/Neon
  | "lawsurface";       // LawSurface-inspired: clean blue/white corporate

interface CrmThemeContextType {
  crmTheme: CrmTheme;
  setCrmTheme: (theme: CrmTheme) => void;
}

const CrmThemeContext = createContext<CrmThemeContextType | undefined>(undefined);

const themeClassMap: Record<CrmTheme, string> = {
  "classic-normal": "",
  "classic-light": "theme-classic-light",
  "neon-dark": "theme-neon-dark",
  "neon-light": "theme-neon-light",
  "lawsurface": "theme-lawsurface",
};

export function CrmThemeProvider({ children }: { children: React.ReactNode }) {
  const [crmTheme, setCrmTheme] = useState<CrmTheme>(() => {
    const stored = localStorage.getItem("aglc-crm-theme");
    return (stored as CrmTheme) || "classic-normal";
  });

  useEffect(() => {
    localStorage.setItem("aglc-crm-theme", crmTheme);
    const root = document.documentElement;
    // Remove all theme classes
    Object.values(themeClassMap).forEach((cls) => {
      if (cls) root.classList.remove(cls);
    });
    // Add current theme class
    const cls = themeClassMap[crmTheme];
    if (cls) root.classList.add(cls);
  }, [crmTheme]);

  return (
    <CrmThemeContext.Provider value={{ crmTheme, setCrmTheme }}>
      {children}
    </CrmThemeContext.Provider>
  );
}

export function useCrmTheme() {
  const context = useContext(CrmThemeContext);
  if (!context) {
    throw new Error("useCrmTheme must be used within CrmThemeProvider");
  }
  return context;
}
