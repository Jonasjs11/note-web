import type { Diagnostic } from "../models/Diagnostic";

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
    ReferenceAnalysis,
} from "./ReferenceAnalysis";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

export function analyzeEquationTargets(
    source: string,
    filePath: string,
): ReferenceAnalysis {
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const targetsByLabel =
        new Map<string, ReferenceTarget>();

    const numbering =
        new EquationNumbering();

    /*
     * Using one pattern preserves the shared
     * document order of equation and align
     * environments.
     */
    const environmentPattern =
        /\\begin\{(equation|align)\}([\s\S]*?)\\end\{\1\}/g;

    for (
        const environmentMatch of
            source.matchAll(environmentPattern)
    ) {
        const environmentType =
            environmentMatch[1];

        const environmentContent =
            environmentMatch[2];

        const completeEnvironment =
            environmentMatch[0];

        const environmentStart =
            environmentMatch.index ?? 0;

        const contentOffset =
            completeEnvironment.indexOf(
                environmentContent,
            );

        const environmentContentStart =
            environmentStart +
            contentOffset;

        if (environmentType === "align") {
            analyzeAlignEnvironment({
                completeSource: source,
                filePath,

                environmentContent,
                environmentContentStart,

                numbering,

                targetsByLabel,
                targets,
                diagnostics,
            });

            continue;
        }

        const number =
            numbering.next();

        analyzeEquationEnvironment({
            completeSource: source,
            filePath,

            environmentContent,
            environmentContentStart,

            number,

            targetsByLabel,
            targets,
            diagnostics,
        });
    }

    return {
        targets,
        diagnostics,
    };
}