import type {
    ContentLanguage,
} from "../../i18n/contentLanguage";

import {
    resolveConceptTranslation,
} from "../models/Concept";

import type {
    Concept,
} from "../models/Concept";

import {
    findConcept,
} from "../registry/conceptRegistry";

interface ConceptPageLabels {
    shortDefinition: string;
    notation: string;
    illustration: string;
    formalDefinition: string;
    prerequisites: string;
    illustrationAlt: (title: string) => string;
}

const labels:
    Record<ContentLanguage, ConceptPageLabels> = {
        en: {
            shortDefinition: "Definition",
            notation: "Notation",
            illustration: "Illustration",
            formalDefinition: "Formal definition",
            prerequisites: "Prerequisites",
            illustrationAlt: (title) => {
                return `Illustration of ${title}`;
            },
        },

        da: {
            shortDefinition: "Definition",
            notation: "Notation",
            illustration: "Illustration",
            formalDefinition: "Formel definition",
            prerequisites: "Forudsætninger",
            illustrationAlt: (title) => {
                return `Illustration af ${title}`;
            },
        },
    };

export function buildConceptPageSource(
    concept: Concept,
    requestedLanguage: ContentLanguage = "en",
): string {
    const resolved = resolveConceptTranslation(
        concept,
        requestedLanguage,
    );

    const translation = resolved.translation;
    const text = labels[resolved.language];

    const sections: string[] = [
        `# ${translation.title}`,
    ];

    sections.push(
        [
            `## ${text.shortDefinition}`,
            translation.shortDefinition.trim(),
        ].join("\n\n"),
    );

    if (translation.notation) {
        sections.push(
            [
                `## ${text.notation}`,
                translation.notation.trim(),
            ].join("\n\n"),
        );
    }

    if (concept.illustration) {
        sections.push(
            [
                `## ${text.illustration}`,
                `![${text.illustrationAlt(translation.title)}](${concept.illustration})`,
            ].join("\n\n"),
        );
    }

    if (translation.formalDefinition) {
        sections.push(
            [
                `## ${text.formalDefinition}`,
                translation.formalDefinition.trim(),
            ].join("\n\n"),
        );
    }

    if (concept.prerequisites.length > 0) {
        sections.push(
            [
                `## ${text.prerequisites}`,
                concept.prerequisites
                    .map((id) => {
                        const prerequisite =
                            findConcept(id);

                        const title = prerequisite
                            ? resolveConceptTranslation(
                                  prerequisite,
                                  resolved.language,
                              ).translation.title
                            : formatTitle(id);

                        return `- [${title}](/concepts/${id})`;
                    })
                    .join("\n"),
            ].join("\n\n"),
        );
    }

    return sections.join("\n\n");
}

function formatTitle(value: string): string {
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
