import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import type { SourceTransformer } from "./Transformer";

const transformers: SourceTransformer[] = [];

export function transformSource(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    let transformedSource = source;

    const diagnostics: Diagnostic[] = [];

    for (const transformer of transformers) {
        const result = transformer(
            transformedSource,
            filePath,
        );

        transformedSource = result.value;
        diagnostics.push(...result.diagnostics);
    }

    return {
        value: transformedSource,
        diagnostics,
    };
}