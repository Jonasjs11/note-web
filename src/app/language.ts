import {
    DEFAULT_CONTENT_LANGUAGE,
    isContentLanguage,
} from "../i18n/contentLanguage";

import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

const LANGUAGE_STORAGE_KEY =
    "note-web:content-language";

export function initializeLanguage():
    ContentLanguage {
    const language = readStoredLanguage();
    applyLanguage(language);
    return language;
}

export function readInitialLanguage():
    ContentLanguage {
    const documentLanguage =
        document.documentElement.dataset
            .contentLanguage;

    return isContentLanguage(documentLanguage)
        ? documentLanguage
        : readStoredLanguage();
}

export function persistLanguage(
    language: ContentLanguage,
): void {
    try {
        localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            language,
        );
    } catch {
        // Persistence is optional; the current session still works.
    }
}

export function applyLanguage(
    language: ContentLanguage,
): void {
    document.documentElement.lang = language;
    document.documentElement.dataset
        .contentLanguage = language;
}

function readStoredLanguage():
    ContentLanguage {
    try {
        const stored = localStorage.getItem(
            LANGUAGE_STORAGE_KEY,
        );

        return isContentLanguage(stored)
            ? stored
            : DEFAULT_CONTENT_LANGUAGE;
    } catch {
        return DEFAULT_CONTENT_LANGUAGE;
    }
}
