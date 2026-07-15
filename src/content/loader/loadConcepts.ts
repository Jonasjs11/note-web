import type { Concept } from "../models/Concept";

const conceptModules = import.meta.glob(
    "../concepts/**/*.ts",
    {
        eager: true,
        import: "default",
    },
) as Record<string, Concept>;

export const concepts: Concept[] = Object.entries(
    conceptModules,
)
    .map(([filePath, concept]) => {
        validateConcept(concept, filePath);

        return concept;
    })
    .sort((first, second) => {
        return first.title.localeCompare(second.title);
    });

function validateConcept(
    concept: Concept,
    filePath: string,
): void {
    if (!concept.id.trim()) {
        throw new Error(
            `Concept in "${filePath}" has no ID.`,
        );
    }

    if (!concept.title.trim()) {
        throw new Error(
            `Concept "${concept.id}" in "${filePath}" has no title.`,
        );
    }

    if (!concept.shortDefinition.trim()) {
        throw new Error(
            `Concept "${concept.id}" in "${filePath}" has no short definition.`,
        );
    }
}