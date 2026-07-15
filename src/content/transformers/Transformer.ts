import type { DiagnosticResult } from "../models/Diagnostic";
import type { ReferenceRegistry } from "../references/ReferenceRegistry";

import type {
    NumberedEquation,
} from "../references/NumberedEquation";

export interface SourceTransformContext {
    referenceRegistry: ReferenceRegistry;
    numberedEquations: NumberedEquation[];
}

export type SourceTransformer = (
    source: string,
    filePath: string,
    context: SourceTransformContext,
) => DiagnosticResult<string>;