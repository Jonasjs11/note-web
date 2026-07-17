import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

import {
    buildConceptPageSource,
} from "../content/builders/buildConceptPageSource";

import {
    conceptSubjects,
    concepts,
    notes,
} from "../content";

import {
    getConceptTranslation,
} from "../content/models/Concept";

import {
    getSubjectPresentation,
} from "../navigation/subjectPresentation";

export type SearchResultKind =
    | "note"
    | "concept";

export interface SearchResult {
    id: string;
    kind: SearchResultKind;
    title: string;
    url: string;
    subject?: string;
    breadcrumb: string;
    snippet: string;
    score: number;
}

interface LocalizedSearchContent {
    title: string;
    breadcrumb: string;
    aliases: string;
    body: string;
    normalizedTitle: string;
    normalizedBreadcrumb: string;
    normalizedAliases: string;
    normalizedBody: string;
}

interface SearchDocument {
    id: string;
    kind: SearchResultKind;
    url: string;
    subject?: string;
    localized: Record<
        ContentLanguage,
        LocalizedSearchContent
    >;
}

interface SearchOptions {
    language?: ContentLanguage;
    subject?: string;
    limit?: number;
}

const searchDocuments = createSearchDocuments();

export function searchContent(
    query: string,
    options: SearchOptions = {},
): SearchResult[] {
    const language = options.language ?? "en";
    const normalizedQuery =
        normalizeSearchText(query);

    if (!normalizedQuery) {
        return [];
    }

    const tokens = normalizedQuery
        .split(" ")
        .filter(Boolean);

    const results: SearchResult[] = [];

    for (const document of searchDocuments) {
        if (
            options.subject &&
            document.subject !== options.subject
        ) {
            continue;
        }

        const score = scoreDocument(
            document,
            normalizedQuery,
            tokens,
        );

        if (score === undefined) {
            continue;
        }

        const display =
            document.localized[language];

        results.push({
            id: document.id,
            kind: document.kind,
            title: display.title,
            url: document.url,
            subject: document.subject,
            breadcrumb: display.breadcrumb,
            snippet: createSnippet(
                display.body,
                tokens,
            ),
            score,
        });
    }

    results.sort((first, second) => {
        if (first.score !== second.score) {
            return second.score - first.score;
        }

        if (first.kind !== second.kind) {
            return first.kind === "note"
                ? -1
                : 1;
        }

        return first.title.localeCompare(
            second.title,
            language,
        );
    });

    return results.slice(
        0,
        options.limit ?? 14,
    );
}

function createSearchDocuments():
    SearchDocument[] {
    const noteDocuments = notes.map((note) => {
        const sectionTitles = note.sections
            .map((section) => section.displayText)
            .join(" ");

        const folderText = note.folders
            .map(formatPathSegment)
            .join(" › ");

        const body = stripMarkup(note.source);

        return createSearchDocument({
            id: `note:${note.url}`,
            kind: "note",
            url: note.url,
            subject: note.subject,
            localized: {
                en: {
                    title: note.title,
                    breadcrumb: createNoteBreadcrumb(
                        note.subject,
                        folderText,
                        "en",
                    ),
                    aliases: sectionTitles,
                    body,
                },
                da: {
                    /* Notes are deliberately not translated. */
                    title: note.title,
                    breadcrumb: createNoteBreadcrumb(
                        note.subject,
                        folderText,
                        "da",
                    ),
                    aliases: sectionTitles,
                    body,
                },
            },
        });
    });

    const conceptDocuments = concepts.map(
        (concept) => {
            const english =
                getConceptTranslation(
                    concept,
                    "en",
                );

            const danish =
                getConceptTranslation(
                    concept,
                    "da",
                );

            return createSearchDocument({
                id: `concept:${concept.id}`,
                kind: "concept",
                url: `/concepts/${concept.id}`,
                subject: conceptSubjects.get(
                    concept.id.toLowerCase(),
                ),
                localized: {
                    en: {
                        title: english.title,
                        breadcrumb:
                            "Generated concept page",
                        aliases:
                            english.aliases.join(" "),
                        body: stripMarkup(
                            buildConceptPageSource(
                                concept,
                                "en",
                            ),
                        ),
                    },
                    da: {
                        title: danish.title,
                        breadcrumb:
                            "Genereret begrebsside",
                        aliases:
                            danish.aliases.join(" "),
                        body: stripMarkup(
                            buildConceptPageSource(
                                concept,
                                "da",
                            ),
                        ),
                    },
                },
            });
        },
    );

    return [
        ...noteDocuments,
        ...conceptDocuments,
    ];
}

function createSearchDocument(
    document: Omit<
        SearchDocument,
        "localized"
    > & {
        localized: Record<
            ContentLanguage,
            Omit<
                LocalizedSearchContent,
                | "normalizedTitle"
                | "normalizedBreadcrumb"
                | "normalizedAliases"
                | "normalizedBody"
            >
        >;
    },
): SearchDocument {
    return {
        ...document,
        localized: {
            en: normalizeLocalizedContent(
                document.localized.en,
            ),
            da: normalizeLocalizedContent(
                document.localized.da,
            ),
        },
    };
}

function normalizeLocalizedContent(
    content: Omit<
        LocalizedSearchContent,
        | "normalizedTitle"
        | "normalizedBreadcrumb"
        | "normalizedAliases"
        | "normalizedBody"
    >,
): LocalizedSearchContent {
    return {
        ...content,
        normalizedTitle:
            normalizeSearchText(content.title),
        normalizedBreadcrumb:
            normalizeSearchText(
                content.breadcrumb,
            ),
        normalizedAliases:
            normalizeSearchText(
                content.aliases,
            ),
        normalizedBody:
            normalizeSearchText(content.body),
    };
}

function scoreDocument(
    document: SearchDocument,
    phrase: string,
    tokens: string[],
): number | undefined {
    let score = 0;

    const localized = [
        document.localized.en,
        document.localized.da,
    ];

    for (const token of tokens) {
        let strongestTokenScore = 0;

        for (const content of localized) {
            let tokenScore = 0;

            if (
                content.normalizedTitle === token
            ) {
                tokenScore += 160;
            } else if (
                content.normalizedTitle
                    .startsWith(token)
            ) {
                tokenScore += 105;
            } else if (
                content.normalizedTitle
                    .includes(token)
            ) {
                tokenScore += 75;
            }

            if (
                content.normalizedAliases
                    .includes(token)
            ) {
                tokenScore += 55;
            }

            if (
                content.normalizedBreadcrumb
                    .includes(token)
            ) {
                tokenScore += 24;
            }

            if (
                content.normalizedBody
                    .includes(token)
            ) {
                tokenScore += 12;
            }

            strongestTokenScore = Math.max(
                strongestTokenScore,
                tokenScore,
            );
        }

        if (strongestTokenScore === 0) {
            return undefined;
        }

        score += strongestTokenScore;
    }

    for (const content of localized) {
        if (
            content.normalizedTitle
                .includes(phrase)
        ) {
            score += 90;
            break;
        }
    }

    for (const content of localized) {
        if (
            content.normalizedAliases
                .includes(phrase)
        ) {
            score += 42;
            break;
        }
    }

    for (const content of localized) {
        if (
            content.normalizedBody
                .includes(phrase)
        ) {
            score += 20;
            break;
        }
    }

    return score;
}

function createNoteBreadcrumb(
    subject: string,
    folderText: string,
    language: ContentLanguage,
): string {
    return [
        getSubjectPresentation(
            subject,
            language,
        ).title,
        folderText,
    ]
        .filter(Boolean)
        .join(" › ");
}

function stripMarkup(source: string): string {
    return source
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\\begin\{[^}]+\}/g, " ")
        .replace(/\\end\{[^}]+\}/g, " ")
        .replace(
            /\\[A-Za-z]+(?:\[[^\]]*\])?\{([^{}]*)\}/g,
            "$1",
        )
        .replace(/[#$*_>{}|~]/g, " ")
        .replace(/\\/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSearchText(
    value: string,
): string {
    return value
        .toLocaleLowerCase()
        .replace(/æ/g, "ae")
        .replace(/ø/g, "o")
        .replace(/å/g, "a")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function createSnippet(
    body: string,
    tokens: string[],
): string {
    const normalizedBody =
        normalizeSearchText(body);

    let matchIndex = -1;

    for (const token of tokens) {
        const candidateIndex =
            normalizedBody.indexOf(token);

        if (
            candidateIndex >= 0 &&
            (
                matchIndex < 0 ||
                candidateIndex < matchIndex
            )
        ) {
            matchIndex = candidateIndex;
        }
    }

    const snippetLength = 150;

    if (matchIndex < 0) {
        return shorten(body, snippetLength);
    }

    const start = Math.max(
        0,
        Math.min(body.length, matchIndex) - 52,
    );

    const end = Math.min(
        body.length,
        start + snippetLength,
    );

    return (
        (start > 0 ? "…" : "") +
        body.slice(start, end).trim() +
        (end < body.length ? "…" : "")
    );
}

function shorten(
    value: string,
    maximumLength: number,
): string {
    if (value.length <= maximumLength) {
        return value;
    }

    return (
        value.slice(0, maximumLength).trim() +
        "…"
    );
}

function formatPathSegment(
    value: string,
): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}
