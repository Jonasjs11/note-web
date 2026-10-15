import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import type {
    NumberedEquation,
} from "../references/NumberedEquation";

import type {
    NumberedFigure,
} from "../references/NumberedFigure";

import type {
    NumberedTable,
} from "../references/NumberedTable";

import {
    ReferenceRegistry,
} from "../references/ReferenceRegistry";

import type {
    ReferenceTarget,
} from "../references/ReferenceTarget";
import type {
    Section,
} from "../references/Section";

import {
    transformConceptCommands,
} from "./transformConceptCommands";

import {
    transformFigureEnvironments,
} from "./transformFigureEnvironments";

import {
    transformLatexSyntax,
} from "./transformLatexSyntax";

import {
    transformReferenceCommands,
} from "./transformReferenceCommands";

import {
    transformSectionHeadings,
} from "./transformSectionHeadings";
import {
    transformSimulationCommands,
} from "./transformSimulationCommands";

import {
    transformTableEnvironments,
} from "./transformTableEnvironments";

import {
    transformCalculatorEnvironments,
} from "./transformCalculatorEnvironments";

import { transformCitationCommands } from "./transformCitationCommands";

import { transformFootnoteCommands } from "./transformFootnoteCommands";

import { transformQuizEnvironments } from "./transformQuizEnvironments";

import type {
    SourceTransformer,
} from "./Transformer";

const transformers: SourceTransformer[] = [
    /*
     * Section anchors must be inserted while headings still match the
     * exact source inspected by analyzeSectionTargets().
     */
    transformSectionHeadings,
    transformQuizEnvironments,
    transformConceptCommands,
    transformReferenceCommands,
    transformCitationCommands,
    transformSimulationCommands,
    transformFigureEnvironments,
    transformTableEnvironments,
    transformCalculatorEnvironments,
    transformLatexSyntax,
    transformFootnoteCommands,
];
export function transformSource(
    source: string,
    filePath: string,
    references: ReferenceTarget[] = [],
    numberedEquations: NumberedEquation[] = [],
    numberedFigures: NumberedFigure[] = [],
    numberedTables: NumberedTable[] = [],
    sections: Section[] = [],
): DiagnosticResult<string> {
    let transformedSource = source;

    const diagnostics: Diagnostic[] = [];

    const context = {
        referenceRegistry:
            new ReferenceRegistry(references),
        numberedEquations,
        numberedFigures,
        numberedTables,
        sections,
    };

    for (const transformer of transformers) {
        const result = transformer(
            transformedSource,
            filePath,
            context,
        );

        transformedSource = result.value;
        diagnostics.push(
            ...result.diagnostics,
        );
    }

    return {
        value: transformedSource,
        diagnostics,
    };
}
