import { useMemo } from "react";
import { useSettings } from "../context/SettingsContext";
import { getTranslations, TranslationKeys } from "../i18n";

export function useTranslation() {
  const { language } = useSettings();

  const t = useMemo(() => {
    return getTranslations(language);
  }, [language]);

  return { t, language };
}
