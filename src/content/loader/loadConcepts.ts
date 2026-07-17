import {
    getConceptTranslation,
    isBilingualConcept,
} from "../models/Concept";

import type {
    Concept,
    ConceptTranslation,
} from "../models/Concept";

const conceptModules = import.meta.glob(
    "../concepts/**/*.ts",
    {
        eager: true,
        import: "default",
    },
) as Record<string, Concept>;

export const conceptSubjects =
    new Map<string, string>();

export const legacyConceptIds: string[] = [];

export const concepts: Concept[] = Object.entries(
    conceptModules,
)
    .map(([filePath, concept]) => {
        validateConcept(concept, filePath);

        conceptSubjects.set(
            concept.id.toLowerCase(),
            readConceptSubject(filePath),
        );

        if (!isBilingualConcept(concept)) {
            legacyConceptIds.push(concept.id);

            if (import.meta.env.DEV) {
                console.warn(
                    `Concept "${concept.id}" uses the legacy English-only shape. ` +
                    "Migrate it to translations.en and translations.da.",
                );
            }
        }

        return concept;
    })
    .sort((first, second) => {
        return getConceptTranslation(
            first,
            "en",
        ).title.localeCompare(
            getConceptTranslation(
                second,
                "en",
            ).title,
        );
    });

function readConceptSubject(
    filePath: string,
): string {
    const relativePath = filePath
        .replace("../concepts/", "")
        .replace(/\.ts$/, "");

    const subject =
        relativePath.split("/")[0];

    if (!subject) {
        throw new Error(
            `Concept "${filePath}" must be inside a subject folder.`,
        );
    }

    return subject;
}

function validateConcept(
    concept: Concept,
    filePath: string,
): void {
    if (!concept.id.trim()) {
        throw new Error(
            `Concept in "${filePath}" has no ID.`,
        );
    }

    if (isBilingualConcept(concept)) {
        validateTranslation(
            concept.id,
            "en",
            concept.translations.en,
            filePath,
        );

        validateTranslation(
            concept.id,
            "da",
            concept.translations.da,
            filePath,
        );

        return;
    }

    validateTranslation(
        concept.id,
        "en",
        concept,
        filePath,
    );
}

function validateTranslation(
    conceptId: string,
    language: "en" | "da",
    translation: ConceptTranslation,
    filePath: string,
): void {
    if (!translation.title.trim()) {
        throw new Error(
            `Concept "${conceptId}" in "${filePath}" has no ${language} title.`,
        );
    }

    if (!translation.shortDefinition.trim()) {
        throw new Error(
            `Concept "${conceptId}" in "${filePath}" has no ${language} short definition.`,
        );
    }

    if (!Array.isArray(translation.aliases)) {
        throw new Error(
            `Concept "${conceptId}" in "${filePath}" must define ${language} aliases as an array.`,
        );
    }
}
