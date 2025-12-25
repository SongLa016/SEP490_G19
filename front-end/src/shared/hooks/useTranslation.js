import { useLanguage } from "../../contexts/LanguageContext";
import { vi } from "../translations/vi";
import { en } from "../translations/en";

const translations = {
  vi,
  en,
};

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        value = translations.vi;
        for (const fallbackKey of keys) {
          if (value && typeof value === "object") {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    return value || key;
  };

  return { t, language };
};
