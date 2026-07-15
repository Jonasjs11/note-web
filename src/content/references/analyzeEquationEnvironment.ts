import type { Diagnostic } from "../models/Diagnostic";

import {
    analyzeNumberedObjectLabels,
} from "./analyzeNumberedObjectLabels";

import type { ReferenceTarget } from "./ReferenceTarget";

interface AnalyzeEquationEnvironmentOptions {
    completeSource: string;
    filePath: string;

    environmentContent: string;
    environmentContentStart: number;

    equationNumber: number;

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
    equationNumber,
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

        equationNumber,
        objectDescription: "equation",

        targetsByLabel,
        targets,
        diagnostics,
    });
}