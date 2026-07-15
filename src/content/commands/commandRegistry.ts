import type { CommandRenderer } from "./CommandRenderer";

import ConceptCommandRenderer from "./renderers/ConceptCommandRenderer";

export const commandRegistry =
    new Map<string, CommandRenderer>([
        [
            "concept",
            ConceptCommandRenderer,
        ],
    ]);