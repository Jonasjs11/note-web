import type { DiagnosticResult } from "../models/Diagnostic";
import type { ReferenceTarget } from "../references/ReferenceTarget";

export interface SourceTransformContext {
    references: ReferenceTarget[];
}

export type SourceTransformer = (
    source: string,
    filePath: string,
    context: SourceTransformContext,
) => DiagnosticResult<string>;