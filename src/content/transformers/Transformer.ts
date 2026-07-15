import type { DiagnosticResult } from "../models/Diagnostic";
import type { ReferenceRegistry } from "../references/ReferenceRegistry";

export interface SourceTransformContext {
    references: ReferenceRegistry[];
}

export type SourceTransformer = (
    source: string,
    filePath: string,
    context: SourceTransformContext,
) => DiagnosticResult<string>;