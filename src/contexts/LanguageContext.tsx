import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "@/i18n/en";
import { he } from "@/i18n/he";
import { yi } from "@/i18n/yi";

export type Lang = "en" | "he" | "yi";
type Translations = typeof en;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: en,
  dir: "ltr",
});

const translations: Record<Lang, Translations> = { en, he, yi };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("torahtale_lang");
    if (saved === "he" || saved === "yi" || saved === "en") return saved as Lang;
    return "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("torahtale_lang", l);
  };

  const dir = lang === "he" || lang === "yi" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
