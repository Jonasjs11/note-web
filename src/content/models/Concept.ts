import type {
    ContentLanguage,
} from "../../i18n/contentLanguage";

export interface ConceptTranslation {
    title: string;
    aliases: string[];
    shortDefinition: string;
    notation?: string;
    formalDefinition?: string;
}

export interface BilingualConcept {
    id: string;

    translations: Record<
        ContentLanguage,
        ConceptTranslation
    >;

    illustration?: string;
    prerequisites: string[];
}

/*
 * Temporary compatibility shape. Existing concepts continue to
 * compile and are treated as English until they are migrated.
 */
export interface LegacyConcept {
    id: string;
    title: string;
    aliases: string[];
    shortDefinition: string;
    notation?: string;
    formalDefinition?: string;
    illustration?: string;
    prerequisites: string[];
    translations?: never;
}

export type Concept =
    | BilingualConcept
    | LegacyConcept;

export interface ResolvedConceptTranslation {
    language: ContentLanguage;
    translation: ConceptTranslation;
}

export function defineConcept(
    concept: BilingualConcept,
): BilingualConcept {
    return concept;
}

export function isBilingualConcept(
    concept: Concept,
): concept is BilingualConcept {
    return concept.translations !== undefined;
}

export function resolveConceptTranslation(
    concept: Concept,
    requestedLanguage: ContentLanguage,
): ResolvedConceptTranslation {
    if (isBilingualConcept(concept)) {
        return {
            language: requestedLanguage,
            translation:
                concept.translations[
                    requestedLanguage
                ],
        };
    }

    return {
        language: "en",
        translation: {
            title: concept.title,
            aliases: concept.aliases,
            shortDefinition:
                concept.shortDefinition,
            notation: concept.notation,
            formalDefinition:
                concept.formalDefinition,
        },
    };
}

export function getConceptTranslation(
    concept: Concept,
    language: ContentLanguage,
): ConceptTranslation {
    return resolveConceptTranslation(
        concept,
        language,
    ).translation;
}

export function getAllConceptAliases(
    concept: Concept,
): string[] {
    if (!isBilingualConcept(concept)) {
        return concept.aliases;
    }

    return Array.from(
        new Set([
            ...concept.translations.en.aliases,
            ...concept.translations.da.aliases,
        ]),
    );
}
