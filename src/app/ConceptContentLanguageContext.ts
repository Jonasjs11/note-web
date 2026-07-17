import {
    createContext,
    useContext,
} from "react";

import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

export const ConceptContentLanguageContext =
    createContext<ContentLanguage | undefined>(
        undefined,
    );

/*
 * Undefined means the reference is rendered in an authored note.
 * Authored notes always keep the English/default concept title.
 */
export function useConceptContentLanguage():
    ContentLanguage | undefined {
    return useContext(
        ConceptContentLanguageContext,
    );
}
