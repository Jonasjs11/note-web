import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import type { SourceTransformer } from "./Transformer";

import { transformLatexMath } from "./transformLatexSyntax";
import { transformConceptCommands } from "./transformConceptCommands";

import type { ReferenceTarget } from "../references/ReferenceTarget";

import { transformReferenceCommands } from "./transformReferenceCommands";

const transformers: SourceTransformer[] = [transformConceptCommands, transformReferenceCommands, transformLatexMath];

export function transformSource(
    source: string,
    filePath: string,
    references: ReferenceTarget[] = [],
): DiagnosticResult<string> {
    let transformedSource = source;

    const diagnostics: Diagnostic[] = [];

    const context = {
        references,
    };

    for (const transformer of transformers) {
        const result = transformer(
            transformedSource,
            filePath,
            context,
        );

        transformedSource = result.value;
        diagnostics.push(...result.diagnostics);
    }

    return {
        value: transformedSource,
        diagnostics,
    };
}