import { buildConceptRegistry } from "../builders/buildConceptRegistry";
import { concepts } from "../loader/loadConcepts";
import type { Concept } from "../models/Concept";

export const conceptRegistry =
    buildConceptRegistry(concepts);

export function findConcept(
    idOrAlias: string,
): Concept | undefined {
    return conceptRegistry.get(
        normalizeConceptKey(idOrAlias),
    );
}

export function getAllConceptIdentifiers(): string[] {
    return concepts.flatMap((concept) => [
        concept.id,
        ...concept.aliases,
    ]);
}

function normalizeConceptKey(
    value: string,
): string {
    return value.trim().toLowerCase();
}