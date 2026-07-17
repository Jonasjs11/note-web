import type {
    ReactNode,
} from "react";

import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

import {
    ConceptContentLanguageContext,
} from "./ConceptContentLanguageContext";

export default function ConceptContentLanguageProvider({
    language,
    children,
}: {
    language: ContentLanguage;
    children: ReactNode;
}) {
    return (
        <ConceptContentLanguageContext.Provider
            value={language}
        >
            {children}
        </ConceptContentLanguageContext.Provider>
    );
}
