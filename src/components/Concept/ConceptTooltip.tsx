import {
    forwardRef,
} from "react";

import type {
    HTMLAttributes,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    useLanguage,
} from "../../app/LanguageContext";

import ConceptContentLanguageProvider
    from "../../app/ConceptContentLanguageProvider";

import LanguageToggle
    from "../Header/LanguageToggle";

import MarkdownRenderer
    from "../Markdown/MarkdownView";

import {
    buildConceptPageSource,
} from "../../content/builders/buildConceptPageSource";

import {
    resolveConceptTranslation,
} from "../../content/models/Concept";

import type {
    Concept,
} from "../../content/models/Concept";

import {
    transformSource,
} from "../../content/transformers/transformSource";

import "./ConceptTooltip.css";

interface ConceptTooltipProps
    extends HTMLAttributes<HTMLElement> {
    concept: Concept;
}

const openPageLabels = {
    en: "Open concept page →",
    da: "Åbn begrebsside →",
} as const;

const previewLabels = {
    en: "concept preview",
    da: "forhåndsvisning af begreb",
} as const;

const ConceptTooltip = forwardRef<
    HTMLElement,
    ConceptTooltipProps
>(function ConceptTooltip(
    {
        concept,
        className,
        ...tooltipProps
    },
    ref,
) {
    const {
        language,
    } = useLanguage();

    const resolved = resolveConceptTranslation(
        concept,
        language,
    );

    const source = buildConceptPageSource(
        concept,
        language,
    );

    const transformedSource = transformSource(
        source,
        `concept-tooltip:${concept.id}:${language}`,
    );

    const combinedClassName = [
        "concept-tooltip",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <aside
            ref={ref}
            className={combinedClassName}
            aria-label={
                `${resolved.translation.title} ${previewLabels[resolved.language]}`
            }
            {...tooltipProps}
        >
            <div className="concept-tooltip-content">
                <ConceptContentLanguageProvider
                    language={language}
                >
                    <MarkdownRenderer
                        key={
                            `tooltip-${concept.id}-${language}`
                        }
                        source={transformedSource.value}
                    />
                </ConceptContentLanguageProvider>
            </div>

            <footer className="concept-tooltip-footer">
                <LanguageToggle variant="tooltip" />

                <Link
                    to={`/concepts/${concept.id}`}
                >
                    {openPageLabels[language]}
                </Link>
            </footer>
        </aside>
    );
});

export default ConceptTooltip;
