import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import type {
    NumberedFigure,
} from "../references/NumberedFigure";

import type { SourceTransformer } from "./Transformer";

import { transformLatexSyntax } from "./transformLatexSyntax";
import { transformConceptCommands } from "./transformConceptCommands";

import { ReferenceRegistry } from "../references/ReferenceRegistry";
import type { ReferenceTarget } from "../references/ReferenceTarget";

import { transformReferenceCommands } from "./transformReferenceCommands";

import type {
    NumberedEquation,
} from "../references/NumberedEquation";

import {
    transformFigureEnvironments,
} from "./transformFigureEnvironments";

const transformers: SourceTransformer[] = [
    transformConceptCommands,
    transformReferenceCommands,
    transformFigureEnvironments,
    transformLatexSyntax,
];

export function transformSource(
    source: string,
    filePath: string,
    references: ReferenceTarget[] = [],
    numberedEquations: NumberedEquation[] = [],
    numberedFigures: NumberedFigure[] = [],
): DiagnosticResult<string> {
    let transformedSource = source;

    const diagnostics: Diagnostic[] = [];

    const context = {
        referenceRegistry:
            new ReferenceRegistry(references),

        numberedEquations,
        numberedFigures,
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