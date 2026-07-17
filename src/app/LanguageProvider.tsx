import {
    useCallback,
    useMemo,
    useState,
} from "react";

import type {
    ReactNode,
} from "react";

import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

import {
    applyLanguage,
    persistLanguage,
    readInitialLanguage,
} from "./language";

import {
    LanguageContext,
} from "./LanguageContext";

import type {
    LanguageContextValue,
} from "./LanguageContext";

interface LanguageProviderProps {
    children: ReactNode;
}

export default function LanguageProvider({
    children,
}: LanguageProviderProps) {
    const [language, setLanguageState] =
        useState<ContentLanguage>(
            readInitialLanguage,
        );

    const setLanguage = useCallback(
        (nextLanguage: ContentLanguage) => {
            setLanguageState(nextLanguage);
            persistLanguage(nextLanguage);
            applyLanguage(nextLanguage);
        },
        [],
    );

    const value = useMemo<LanguageContextValue>(
        () => ({
            language,
            setLanguage,
        }),
        [language, setLanguage],
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
