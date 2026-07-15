import type { Diagnostic } from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type { ReferenceTarget } from "./ReferenceTarget";
import { splitAlignRows } from "./splitAlignRows";

interface AnalyzeAlignEnvironmentOptions {
    completeSource: string;
    filePath: string;

    environmentContent: string;
    environmentContentStart: number;

    previousEquationNumber: number;

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
 * Returns the final equation number after all
 * rows have been processed.
 */
export function analyzeAlignEnvironment({
    completeSource,
    filePath,
    environmentContent,
    environmentContentStart,
    previousEquationNumber,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeAlignEnvironmentOptions): number {
    const rows = splitAlignRows(
        environmentContent,
    );

    let equationNumber =
        previousEquationNumber;

    for (const row of rows) {
        equationNumber++;

        analyzeNumberedObjectLabels({
            completeSource,
            filePath,

            objectSource: row.source,

            objectStart:
                environmentContentStart +
                row.startOffset,

            equationNumber,
            objectDescription: "align row",

            targetsByLabel,
            targets,
            diagnostics,
        });
    }

    return equationNumber;
}