import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ru" | "tj" | "en";

interface Translations {
  [key: string]: {
    ru: string;
    tj: string;
    en: string;
  };
}

const translations: Translations = {
  // Map page
  "map.title": {
    ru: "Карта Таджикистана",
    tj: "Харитаи Тоҷикистон",
    en: "Map of Tajikistan",
  },
  "map.colorful": {
    ru: "Цветная",
    tj: "Рангин",
    en: "Colorful",
  },
  "map.minimal": {
    ru: "Минимал",
    tj: "Минимал",
    en: "Minimal",
  },
  "map.locations": {
    ru: "Локации",
    tj: "Ҷойҳо",
    en: "Locations",
  },
  "map.noLocations": {
    ru: "Нет локаций",
    tj: "Ҷойҳо нест",
    en: "No locations",
  },
  "map.loading": {
    ru: "Загрузка...",
    tj: "Боркунӣ...",
    en: "Loading...",
  },
  "map.description": {
    ru: "Описание",
    tj: "Тавсиф",
    en: "Description",
  },
  "map.coordinates": {
    ru: "Координаты",
    tj: "Координатҳо",
    en: "Coordinates",
  },
  "map.close": {
    ru: "Закрыть",
    tj: "Пӯшидан",
    en: "Close",
  },
  "map.viewDetails": {
    ru: "Подробнее",
    tj: "Муфассал",
    en: "View Details",
  },
  // Language names
  "lang.ru": {
    ru: "Русский",
    tj: "Русӣ",
    en: "Russian",
  },
  "lang.tj": {
    ru: "Таджикский",
    tj: "Тоҷикӣ",
    en: "Tajik",
  },
  "lang.en": {
    ru: "Английский",
    tj: "Англисӣ",
    en: "English",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && ["ru", "tj", "en"].includes(saved)) {
        return saved;
      }
    }
    return "ru";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.ru || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
