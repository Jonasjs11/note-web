import type { Concept } from "../models/Concept";

export type ConceptRegistry = ReadonlyMap<
    string,
    Concept
>;

export function buildConceptRegistry(
    concepts: Concept[],
): ConceptRegistry {
    const registry = new Map<string, Concept>();

    for (const concept of concepts) {
        registerKey(
            registry,
            concept.id,
            concept,
            "ID",
        );

        for (const alias of concept.aliases) {
            registerKey(
                registry,
                alias,
                concept,
                "alias",
            );
        }
    }

    return registry;
}

function registerKey(
    registry: Map<string, Concept>,
    key: string,
    concept: Concept,
    keyType: string,
): void {
    const normalizedKey = normalizeConceptKey(key);
    const existingConcept = registry.get(normalizedKey);

    if (
        existingConcept &&
        existingConcept.id !== concept.id
    ) {
        throw new Error(
            `Duplicate concept ${keyType} "${key}". ` +
            `It is used by both "${existingConcept.id}" ` +
            `and "${concept.id}".`,
        );
    }

    registry.set(normalizedKey, concept);
}

export function normalizeConceptKey(
    value: string,
): string {
    return value.trim().toLowerCase();
}