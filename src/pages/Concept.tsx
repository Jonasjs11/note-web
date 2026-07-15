import { useParams } from "react-router-dom";

import DocumentRenderer from "../components/Document/DocumentRenderer";

import { findConcept } from "../content";
import { buildConceptPageSource } from "../content/builders/buildConceptPageSource";
import { transformSource } from "../content/transformers/transformSource";

export default function Concept() {
    const { conceptId } = useParams();

    if (!conceptId) {
        return <ConceptNotFound />;
    }

    const concept = findConcept(conceptId);

    /*
     * Concept URLs must use their actual IDs.
     * Aliases are for search, not for URLs.
     */
    if (
        !concept ||
        concept.id.toLowerCase() !==
            conceptId.toLowerCase()
    ) {
        return <ConceptNotFound />;
    }

    const source = buildConceptPageSource(concept);

    const transformed = transformSource(
        source,
        `concept:${concept.id}`,
    );

    return (
        <DocumentRenderer
            key={concept.id}
            source={transformed.value}
        />
    );
}

function ConceptNotFound() {
    return (
        <>
            <h1>Concept not found</h1>

            <p>
                No concept exists with this ID.
            </p>
        </>
    );
}