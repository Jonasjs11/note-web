import type { DiagnosticResult } from "../models/Diagnostic";

export type SourceTransformer = (
    source: string,
    filePath: string,
) => DiagnosticResult<string>;