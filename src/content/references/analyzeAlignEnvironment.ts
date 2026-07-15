import type {
    Diagnostic,
} from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type {
    EquationNumbering,
} from "./EquationNumbering";

import type {
    NumberedEquation,
} from "./NumberedEquation";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

import {
    splitAlignRows,
} from "./splitAlignRows";

interface AnalyzeAlignEnvironmentOptions {
    completeSource: string;
    filePath: string;

    environmentContent: string;
    environmentContentStart: number;

    numbering: EquationNumbering;
    subequationGroup?: number;

    numberedEquations: NumberedEquation[];

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

export function analyzeAlignEnvironment({
    completeSource,
    filePath,
    environmentContent,
    environmentContentStart,
    numbering,
    subequationGroup,
    numberedEquations,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeAlignEnvironmentOptions): void {
    const rows = splitAlignRows(
        environmentContent,
    );

    for (const row of rows) {
        const number = numbering.next();

        const label =
            analyzeNumberedObjectLabels({
                completeSource,
                filePath,

                objectSource: row.source,

                objectStart:
                    environmentContentStart +
                    row.startOffset,

                number,
                objectDescription:
                    "align row",

                targetsByLabel,
                targets,
                diagnostics,
            });

        numberedEquations.push({
            kind: "align-row",
            number,
            label,

            sourceStart:
                environmentContentStart +
                row.startOffset,

            sourceEnd:
                environmentContentStart +
                row.endOffset,

            subequationGroup,
        });
    }
}