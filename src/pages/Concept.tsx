import {
    useParams,
} from "react-router-dom";

import {
    useLanguage,
} from "../app/LanguageContext";

import ConceptContentLanguageProvider
    from "../app/ConceptContentLanguageProvider";

import MarkdownRenderer
    from "../components/Markdown/MarkdownView";

import {
    findConcept,
} from "../content";

import {
    buildConceptPageSource,
} from "../content/builders/buildConceptPageSource";

import {
    transformSource,
} from "../content/transformers/transformSource";

const notFoundText = {
    en: {
        title: "Concept not found",
        body: "No concept exists with this ID.",
    },

    da: {
        title: "Begrebet blev ikke fundet",
        body: "Der findes intet begreb med dette ID.",
    },
} as const;

export default function Concept() {
    const {
        language,
    } = useLanguage();

    const {
        conceptId,
    } = useParams();

    if (!conceptId) {
        return (
            <ConceptNotFound
                language={language}
            />
        );
    }

    const concept = findConcept(conceptId);

    /*
     * IDs and URLs remain English and stable. Translated aliases
     * are searchable lookup keys, but never canonical URLs.
     */
    if (
        !concept ||
        concept.id.toLowerCase() !==
            conceptId.toLowerCase()
    ) {
        return (
            <ConceptNotFound
                language={language}
            />
        );
    }

    const source = buildConceptPageSource(
        concept,
        language,
    );

    const transformed = transformSource(
        source,
        `concept:${concept.id}:${language}`,
    );

    return (
        <ConceptContentLanguageProvider
            language={language}
        >
            <MarkdownRenderer
                key={`${concept.id}-${language}`}
                source={transformed.value}
            />
        </ConceptContentLanguageProvider>
    );
}

function ConceptNotFound({
    language,
}: {
    language: "en" | "da";
}) {
    const text = notFoundText[language];

    return (
        <>
            <h1>{text.title}</h1>
            <p>{text.body}</p>
        </>
    );
}
