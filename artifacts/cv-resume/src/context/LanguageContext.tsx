import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "en" | "ar";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  dir: "ltr",
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("cv-lang") as Lang) || "en";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isRTL = lang === "ar";

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("cv-lang", l);
  };

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    if (lang === "ar") {
      document.documentElement.style.fontFamily =
        "'Noto Sans Arabic', 'Cairo', 'Tajawal', -apple-system, sans-serif";
    } else {
      document.documentElement.style.fontFamily = "";
    }
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
