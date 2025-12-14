import { tr } from "./translations/tr";
import { en } from "./translations/en";
import { Language } from "../context/SettingsContext";

export type TranslationKeys = typeof tr;

const translations: Record<Language, TranslationKeys> = {
  tr,
  en,
};

export function getTranslations(language: Language): TranslationKeys {
  return translations[language] || translations.tr;
}

export { tr, en };
