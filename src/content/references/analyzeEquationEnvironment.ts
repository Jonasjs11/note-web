import type {
    Diagnostic,
} from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type {
    NumberedEquation,
} from "./NumberedEquation";

import type {
    ReferenceNumber,
    ReferenceTarget,
} from "./ReferenceTarget";

interface AnalyzeEquationEnvironmentOptions {
    completeSource: string;
    filePath: string;

    environmentContent: string;
    environmentContentStart: number;

    environmentStart: number;
    environmentEnd: number;

    number: ReferenceNumber;
    subequationGroup?: number;

    numberedEquations: NumberedEquation[];

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

export function analyzeEquationEnvironment({
    completeSource,
    filePath,
    environmentContent,
    environmentContentStart,
    environmentStart,
    environmentEnd,
    number,
    subequationGroup,
    numberedEquations,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeEquationEnvironmentOptions): void {
    const label =
        analyzeNumberedObjectLabels({
            completeSource,
            filePath,

            objectSource:
                environmentContent,

            objectStart:
                environmentContentStart,

            number,
            objectDescription: "equation",

            targetsByLabel,
            targets,
            diagnostics,
        });

    numberedEquations.push({
        kind: "equation",
        number,
        label,

        sourceStart: environmentStart,
        sourceEnd: environmentEnd,

        subequationGroup,
    });
}