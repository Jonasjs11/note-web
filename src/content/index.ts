import { buildConceptRegistry } from "./builders/buildConceptRegistry";
import { buildNavigation } from "./builders/navigation";

import { concepts } from "./loader/loadConcepts";
import { notes } from "./loader/loadNotes";

export const navigation = buildNavigation(notes);

export const conceptRegistry =
    buildConceptRegistry(concepts);

import type { Concept } from "./models/Concept";

export function findConcept(
    idOrAlias: string,
): Concept | undefined {
    return conceptRegistry.get(
        idOrAlias.trim().toLowerCase(),
    );
}

export {
    concepts,
    notes,
};