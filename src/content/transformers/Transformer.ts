import type { DiagnosticResult } from "../models/Diagnostic";
import type { ReferenceRegistry } from "../references/ReferenceRegistry";

import type {
    NumberedEquation,
} from "../references/NumberedEquation";

import type {
    NumberedFigure,
} from "../references/NumberedFigure";

export interface SourceTransformContext {
    referenceRegistry: ReferenceRegistry;

    numberedEquations: NumberedEquation[];
    numberedFigures: NumberedFigure[];
}

export type SourceTransformer = (
    source: string,
    filePath: string,
    context: SourceTransformContext,
) => DiagnosticResult<string>;