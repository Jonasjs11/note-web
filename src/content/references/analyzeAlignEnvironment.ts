import type { Diagnostic } from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type {
    EquationNumbering,
} from "./EquationNumbering";

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

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

/**
 * Analyzes every numbered row in one align
 * environment.
 *
 * The numbering object determines whether rows
 * receive ordinary or subequation numbers.
 */
export function analyzeAlignEnvironment({
    completeSource,
    filePath,
    environmentContent,
    environmentContentStart,
    numbering,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeAlignEnvironmentOptions): void {
    const rows = splitAlignRows(
        environmentContent,
    );

    for (const row of rows) {
        const number = numbering.next();

        analyzeNumberedObjectLabels({
            completeSource,
            filePath,

            objectSource: row.source,

            objectStart:
                environmentContentStart +
                row.startOffset,

            number,
            objectDescription: "align row",

            targetsByLabel,
            targets,
            diagnostics,
        });
    }
}