import type { Diagnostic } from "../models/Diagnostic";

import { getSourceLocation } from "../parser/getSourceLocation";

import type { ReferenceAnalysis } from "./ReferenceAnalysis";
import type { ReferenceTarget } from "./ReferenceTarget";

import { createReferenceAnchor } from "./createReferenceAnchor";
import {
    splitAlignRows,
    type AlignRowInfo,
} from "./splitAlignRows";

export function analyzeEquationTargets(
    source: string,
    filePath: string,
): ReferenceAnalysis {
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const targetsByLabel =
        new Map<string, ReferenceTarget>();

    /*
     * A single expression preserves the order of
     * equation and align environments.
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
            environmentMatch.index ?? 0;

        const contentOffset =
            completeEnvironment.indexOf(
                environmentContent,
            );

        const contentStart =
            environmentStart + contentOffset;

        if (environmentType === "align") {
            const rows = splitAlignRows(
                environmentContent,
            );

            for (const row of rows) {
                equationNumber++;

                analyzeAlignRow(
                    source,
                    filePath,
                    row,
                    contentStart,
                    equationNumber,
                    targetsByLabel,
                    targets,
                    diagnostics,
                );
            }

            continue;
        }

        equationNumber++;

        analyzeNumberedObjectLabels(
            source,
            filePath,
            environmentContent,
            contentStart,
            equationNumber,
            "equation",
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

function analyzeAlignRow(
    source: string,
    filePath: string,
    row: AlignRowInfo,
    environmentContentStart: number,
    equationNumber: number,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
): void {
    const rowStart =
        environmentContentStart +
        row.startOffset;

    analyzeNumberedObjectLabels(
        source,
        filePath,
        row.source,
        rowStart,
        equationNumber,
        "align row",
        targetsByLabel,
        targets,
        diagnostics,
    );
}

function analyzeNumberedObjectLabels(
    source: string,
    filePath: string,
    objectSource: string,
    objectStart: number,
    equationNumber: number,
    objectDescription:
        | "equation"
        | "align row",
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
        ...objectSource.matchAll(
            labelPattern,
        ),
    ];

    if (labelMatches.length === 0) {
        return;
    }

    if (labelMatches.length > 1) {
        for (
            const extraLabel of
                labelMatches.slice(1)
        ) {
            diagnostics.push({
                severity: "error",
                message:
                    `An ${objectDescription} ` +
                    "may only have one label.",
                filePath,
                location: getSourceLocation(
                    source,
                    objectStart +
                        (extraLabel.index ?? 0),
                ),
            });
        }
    }

    const firstLabelMatch =
        labelMatches[0];

    const label =
        firstLabelMatch[1].trim();

    const labelIndex =
        objectStart +
        (firstLabelMatch.index ?? 0);

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                `An ${objectDescription} ` +
                "label cannot be empty.",
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