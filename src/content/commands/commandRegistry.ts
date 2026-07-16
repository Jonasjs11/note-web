import type { CommandRenderer } from "./CommandRenderer";

import ConceptCommandRenderer from "./renderers/ConceptCommandRenderer";

import ReferenceCommandRenderer from "./renderers/ReferenceCommandRenderer";

import FigureCommandRenderer from "./renderers/FigureCommandRenderer";

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
    ]);