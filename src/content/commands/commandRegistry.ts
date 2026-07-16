import type { CommandRenderer } from "./CommandRenderer";

import ConceptCommandRenderer from "./renderers/ConceptCommandRenderer";

import ReferenceCommandRenderer from "./renderers/ReferenceCommandRenderer";

import FigureCommandRenderer from "./renderers/FigureCommandRenderer";

import TableCommandRenderer from "./renderers/TableCommandRenderer";

import SectionAnchorCommandRenderer from "./renderers/SectionAnchorCommandRenderer";


export const commandRegistry =
    new Map<string, CommandRenderer>([
        [
            "concept",
            ConceptCommandRenderer,
        ],
        [
            "reference",
            ReferenceCommandRenderer,
        ],
        [
            "figure",
            FigureCommandRenderer,
        ],
        [
            "table",
            TableCommandRenderer,
        ],
        [
            "section-anchor", 
            SectionAnchorCommandRenderer,
        ]
    ]);