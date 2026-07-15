import {
    forwardRef,
    type HTMLAttributes,
} from "react";

import { Link } from "react-router-dom";

import MarkdownRenderer from "../Markdown/MarkdownRenderer";

import { buildConceptPageSource } from "../../content/builders/buildConceptPageSource";
import type { Concept } from "../../content/models/Concept";
import { transformSource } from "../../content/transformers/transformSource";

import "./ConceptTooltip.css";

interface ConceptTooltipProps
    extends HTMLAttributes<HTMLElement> {
    concept: Concept;
}

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
    const source =
        buildConceptPageSource(concept);

    const transformedSource =
        transformSource(
            source,
            `concept-tooltip:${concept.id}`,
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
                `${concept.title} concept preview`
            }
            {...tooltipProps}
        >
            <div className="concept-tooltip-content">
                <MarkdownRenderer
                    key={`tooltip-${concept.id}`}
                    source={transformedSource.value}
                />
            </div>

            <footer className="concept-tooltip-footer">
                <Link
                    to={`/concepts/${concept.id}`}
                >
                    Open concept page →
                </Link>
            </footer>
        </aside>
    );
});

export default ConceptTooltip;