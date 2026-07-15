import type {
    Diagnostic,
} from "../models/Diagnostic";

import {
    getSourceLocation,
} from "../parser/getSourceLocation";

import {
    analyzeAlignEnvironment,
} from "./analyzeAlignEnvironment";

import {
    analyzeEquationEnvironment,
} from "./analyzeEquationEnvironment";

import {
    EquationNumbering,
} from "./EquationNumbering";

import type {
    NumberedEquation,
} from "./NumberedEquation";

import type {
    ReferenceAnalysis,
} from "./ReferenceAnalysis";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

interface GroupCounter {
    next: number;
}

interface AnalyzeSourceRangeOptions {
    completeSource: string;
    sourceFragment: string;
    sourceFragmentStart: number;
    filePath: string;

    numbering: EquationNumbering;
    activeSubequationGroup?: number;
    groupCounter: GroupCounter;

    numberedEquations: NumberedEquation[];

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

export function analyzeEquationTargets(
    source: string,
    filePath: string,
): ReferenceAnalysis {
    const numberedEquations:
        NumberedEquation[] = [];

    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const targetsByLabel =
        new Map<string, ReferenceTarget>();

    const numbering =
        new EquationNumbering();

    const groupCounter: GroupCounter = {
        next: 0,
    };

    analyzeSourceRange({
        completeSource: source,
        sourceFragment: source,
        sourceFragmentStart: 0,
        filePath,

        numbering,
        groupCounter,

        numberedEquations,

        targetsByLabel,
        targets,
        diagnostics,
    });

    return {
        numberedEquations,
        targets,
        diagnostics,
    };
}

function analyzeSourceRange({
    completeSource,
    sourceFragment,
    sourceFragmentStart,
    filePath,
    numbering,
    activeSubequationGroup,
    groupCounter,
    numberedEquations,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeSourceRangeOptions): void {
    const environmentPattern =
        /\\begin\{(equation|align|subequations)\}([\s\S]*?)\\end\{\1\}/g;

    for (
        const environmentMatch of
            sourceFragment.matchAll(
                environmentPattern,
            )
    ) {
        const environmentType =
            environmentMatch[1];

        const environmentContent =
            environmentMatch[2];

        const completeEnvironment =
            environmentMatch[0];

        const relativeEnvironmentStart =
            environmentMatch.index ?? 0;

        const environmentStart =
            sourceFragmentStart +
            relativeEnvironmentStart;

        const contentOffset =
            completeEnvironment.indexOf(
                environmentContent,
            );

        const environmentContentStart =
            environmentStart +
            contentOffset;
        
        const environmentEnd =
            environmentStart +
            completeEnvironment.length;

        if (
            environmentType ===
            "subequations"
        ) {
            analyzeSubequationsEnvironment({
                completeSource,
                environmentContent,
                environmentContentStart,
                environmentStart,
                filePath,

                numbering,
                activeSubequationGroup,
                groupCounter,

                numberedEquations,

                targetsByLabel,
                targets,
                diagnostics,
            });

            continue;
        }

        if (environmentType === "align") {
            analyzeAlignEnvironment({
                completeSource,
                filePath,

                environmentContent,
                environmentContentStart,

                numbering,
                subequationGroup:
                    activeSubequationGroup,

                numberedEquations,

                targetsByLabel,
                targets,
                diagnostics,
            });

            continue;
        }

        const number = numbering.next();

        analyzeEquationEnvironment({
            completeSource,
            filePath,

            environmentContent,
            environmentContentStart,

            environmentStart,
            environmentEnd,

            number,
            subequationGroup:
                activeSubequationGroup,

            numberedEquations,

            targetsByLabel,
            targets,
            diagnostics,
        });
    }
}

interface AnalyzeSubequationsEnvironmentOptions {
    completeSource: string;

    environmentContent: string;
    environmentContentStart: number;
    environmentStart: number;

    filePath: string;

    numbering: EquationNumbering;
    activeSubequationGroup?: number;
    groupCounter: GroupCounter;

    numberedEquations: NumberedEquation[];

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

function analyzeSubequationsEnvironment({
    completeSource,
    environmentContent,
    environmentContentStart,
    environmentStart,
    filePath,
    numbering,
    activeSubequationGroup,
    groupCounter,
    numberedEquations,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeSubequationsEnvironmentOptions): void {
    if (numbering.isInsideSubequations()) {
        diagnostics.push({
            severity: "error",
            message:
                "Nested subequation groups are not supported.",
            filePath,
            location: getSourceLocation(
                completeSource,
                environmentStart,
            ),
        });

        analyzeSourceRange({
            completeSource,
            sourceFragment:
                environmentContent,
            sourceFragmentStart:
                environmentContentStart,
            filePath,

            numbering,
            activeSubequationGroup,
            groupCounter,

            numberedEquations,

            targetsByLabel,
            targets,
            diagnostics,
        });

        return;
    }

    const groupIndex =
        groupCounter.next++;

    numbering.beginSubequations();

    try {
        analyzeSourceRange({
            completeSource,
            sourceFragment:
                environmentContent,
            sourceFragmentStart:
                environmentContentStart,
            filePath,

            numbering,
            activeSubequationGroup:
                groupIndex,
            groupCounter,

            numberedEquations,

            targetsByLabel,
            targets,
            diagnostics,
        });
    } finally {
        numbering.endSubequations();
    }
}