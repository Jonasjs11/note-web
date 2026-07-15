import { useState } from "react";
import { Link } from "react-router-dom";

import {
    autoUpdate,
    FloatingPortal,
    flip,
    offset,
    safePolygon,
    shift,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
} from "@floating-ui/react";

import { findConcept } from "../../content";

import ConceptTooltip from "./ConceptTooltip";

interface ConceptReferenceProps {
    id: string;
    alias?: string;
}

export default function ConceptReference({
    id,
    alias,
}: ConceptReferenceProps) {
    const concept = findConcept(id);

    const [isOpen, setIsOpen] = useState(false);

    const {
        refs,
        floatingStyles,
        context,
    } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,

        placement: "bottom-start",

        middleware: [
            offset(8),
            flip({
                padding: 12,
            }),
            shift({
                padding: 12,
            }),
        ],

        whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context, {
        delay: {
            open: 150,
            close: 75,
        },

        handleClose: safePolygon({
            buffer: 1,
        }),
    });

    const focus = useFocus(context);
    const dismiss = useDismiss(context);

    const {
        getReferenceProps,
        getFloatingProps,
    } = useInteractions([
        hover,
        focus,
        dismiss,
    ]);

    if (!concept) {
        return (
            <span
                className="command-error"
                title={`Unknown concept ID: ${id}`}
            >
                {alias ?? id}
            </span>
        );
    }

    return (
        <span className="concept-reference">
            <Link
                ref={refs.setReference}
                to={`/concepts/${concept.id}`}
                className="concept-link"
                {...getReferenceProps()}
            >
                {alias ?? concept.title}
            </Link>

            {isOpen && (
                <FloatingPortal>
                    <ConceptTooltip
                        ref={refs.setFloating}
                        concept={concept}
                        style={floatingStyles}
                        {...getFloatingProps()}
                    />
                </FloatingPortal>
            )}
        </span>
    );
}