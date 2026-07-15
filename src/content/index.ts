import { buildNavigation } from "./builders/navigation";

import {
    conceptRegistry,
    findConcept,
    getAllConceptIdentifiers,
} from "./registry/conceptRegistry";

import { concepts } from "./loader/loadConcepts";
import { notes } from "./loader/loadNotes";

export const navigation = buildNavigation(notes);

export {
    conceptRegistry,
    concepts,
    findConcept,
    getAllConceptIdentifiers,
    notes,
};