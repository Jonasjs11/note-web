import {
    createContext,
    useContext,
} from "react";

import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

export interface LanguageContextValue {
    language: ContentLanguage;
    setLanguage:
        (language: ContentLanguage) => void;
}

export const LanguageContext =
    createContext<
        LanguageContextValue | undefined
    >(undefined);

export function useLanguage():
    LanguageContextValue {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error(
            "useLanguage must be used inside LanguageProvider.",
        );
    }

    return context;
}
