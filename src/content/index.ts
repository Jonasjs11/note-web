import {
    buildNavigation,
} from "./builders/navigation";

import {
    conceptRegistry,
    findConcept,
    getAllConceptIdentifiers,
} from "./registry/conceptRegistry";

import {
    concepts,
    conceptSubjects,
    legacyConceptIds,
} from "./loader/loadConcepts";

import {
    notes,
} from "./loader/loadNotes";

export const navigation =
    buildNavigation(notes);

export {
    conceptRegistry,
    concepts,
    conceptSubjects,
    findConcept,
    getAllConceptIdentifiers,
    legacyConceptIds,
    notes,
};
