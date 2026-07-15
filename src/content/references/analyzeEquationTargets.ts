import type { Diagnostic } from "../models/Diagnostic";

import { getSourceLocation } from "../parser/getSourceLocation";

import type { ReferenceAnalysis } from "./ReferenceAnalysis";
import type { ReferenceTarget } from "./ReferenceTarget";

import { createReferenceAnchor } from "./createReferenceAnchor";
import { splitAlignRows } from "./splitAlignRows";

export function analyzeEquationTargets(
    source: string,
    filePath: string,
): ReferenceAnalysis {
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const targetsByLabel =
        new Map<string, ReferenceTarget>();

    /*
     * Matching both environment types with one pattern
     * preserves their order in the original document.
     */
    const environmentPattern =
        /\\begin\{(equation|align)\}([\s\S]*?)\\end\{\1\}/g;

    let equationNumber = 0;

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
            environmentMatch.index;

        if (environmentType === "align") {
            const rows =
                splitAlignRows(
                    environmentContent,
                );

            equationNumber += rows.length;

            /*
             * Labels inside align rows are deliberately
             * not processed yet.
             *
             * For this milestone, align only contributes
             * numbered rows to the equation sequence.
             */
            continue;
        }

        equationNumber++;

        analyzeEquationEnvironment(
            source,
            filePath,
            completeEnvironment,
            environmentContent,
            environmentStart,
            equationNumber,
            targetsByLabel,
            targets,
            diagnostics,
        );
    }

    return {
        targets,
        diagnostics,
    };
}

function analyzeEquationEnvironment(
    source: string,
    filePath: string,
    completeEnvironment: string,
    environmentContent: string,
    environmentStart: number,
    equationNumber: number,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
): void {
    const labelPattern =
        /\\label\{([^{}]*)\}/g;

    const labelMatches = [
        ...environmentContent.matchAll(
            labelPattern,
        ),
    ];

    if (labelMatches.length === 0) {
        return;
    }

    const contentOffset =
        completeEnvironment.indexOf(
            environmentContent,
        );

    const contentStart =
        environmentStart + contentOffset;

    if (labelMatches.length > 1) {
        for (
            const extraLabel of
                labelMatches.slice(1)
        ) {
            const absoluteIndex =
                contentStart +
                (extraLabel.index ?? 0);

            diagnostics.push({
                severity: "error",
                message:
                    "An equation may only have one label.",
                filePath,
                location: getSourceLocation(
                    source,
                    absoluteIndex,
                ),
            });
        }
    }

    const firstLabelMatch =
        labelMatches[0];

    const label =
        firstLabelMatch[1].trim();

    const labelIndex =
        contentStart +
        (firstLabelMatch.index ?? 0);

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                "An equation label cannot be empty.",
            filePath,
            location: getSourceLocation(
                source,
                labelIndex,
            ),
        });

        return;
    }

    if (!label.startsWith("eq:")) {
        diagnostics.push({
            severity: "warning",
            message:
                `Equation label "${label}" ` +
                `should begin with "eq:".`,
            filePath,
            location: getSourceLocation(
                source,
                labelIndex,
            ),
        });
    }

    if (targetsByLabel.has(label)) {
        diagnostics.push({
            severity: "error",
            message:
                `Duplicate label "${label}".`,
            filePath,
            location: getSourceLocation(
                source,
                labelIndex,
            ),
        });

        return;
    }

    const target: ReferenceTarget = {
        label,
        type: "equation",

        number: {
            primary: equationNumber,
        },

        anchorId:
            createReferenceAnchor(label),
    };

    targetsByLabel.set(label, target);
    targets.push(target);
}