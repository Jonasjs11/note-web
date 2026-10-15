import { useCallback } from "react";
import { useLanguage } from "../app/LanguageContext";
import { translateUi } from "./uiTranslations";
import type { UiTranslationKey } from "./uiTranslations";

/** Uses the site's existing reactive English/Danish language selection. */
export function useUiTranslation() {
    const { language } = useLanguage();
    return useCallback(
        (key: UiTranslationKey, values?: Record<string, string | number>) =>
            translateUi(language, key, values),
        [language],
    );
}
