import type {
    Diagnostic,
} from "../models/Diagnostic";

import type {
    NumberedFigure,
} from "./NumberedFigure";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

export interface FigureAnalysis {
    numberedFigures: NumberedFigure[];
    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}