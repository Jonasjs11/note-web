import type { Diagnostic } from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type {
    ReferenceNumber,
    ReferenceTarget,
} from "./ReferenceTarget";

interface AnalyzeEquationEnvironmentOptions {
    completeSource: string;
    filePath: string;

    environmentContent: string;
    environmentContentStart: number;

    number: ReferenceNumber;

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
    number,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeEquationEnvironmentOptions): void {
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
}