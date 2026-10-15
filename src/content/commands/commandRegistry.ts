import type { CommandRenderer } from "./CommandRenderer";

import ConceptCommandRenderer from "./renderers/ConceptCommandRenderer";

import ReferenceCommandRenderer from "./renderers/ReferenceCommandRenderer";

import FigureCommandRenderer from "./renderers/FigureCommandRenderer";

import TableCommandRenderer from "./renderers/TableCommandRenderer";

import SectionAnchorCommandRenderer from "./renderers/SectionAnchorCommandRenderer";
import SimulationCommandRenderer from "./renderers/SimulationCommandRenderer";
import CalculatorCommandRenderer from "./renderers/CalculatorCommandRenderer";
import QuizCommandRenderer from "./renderers/QuizCommandRenderer";

import { WebsiteCitationRenderer, BibliographyCitationRenderer }
    from "./renderers/CitationCommandRenderer";
import BibliographyCommandRenderer from "./renderers/BibliographyCommandRenderer";

export const commandRegistry =
    new Map<string, CommandRenderer>([
        ["cite-url", WebsiteCitationRenderer],
        ["cite-bib", BibliographyCitationRenderer],
        ["bibliography", BibliographyCommandRenderer],
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
        ],
        [
            "simulation",
            SimulationCommandRenderer,
        ],
        [
            "calculator",
            CalculatorCommandRenderer,
        ],
        [
            "quiz",
            QuizCommandRenderer,
        ],
    ]);
