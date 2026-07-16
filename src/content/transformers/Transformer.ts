import type { DiagnosticResult } from "../models/Diagnostic";
import type { ReferenceRegistry } from "../references/ReferenceRegistry";

import type {
    NumberedEquation,
} from "../references/NumberedEquation";

import type {
    NumberedFigure,
} from "../references/NumberedFigure";

import type {
    NumberedTable,
} from "../references/NumberedTable";

export interface SourceTransformContext {
    referenceRegistry: ReferenceRegistry;

    numberedEquations: NumberedEquation[];
    numberedFigures: NumberedFigure[];
    numberedTables: NumberedTable[];
}

export type SourceTransformer = (
    source: string,
    filePath: string,
    context: SourceTransformContext,
) => DiagnosticResult<string>;
