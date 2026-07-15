import type { Diagnostic } from "../models/Diagnostic";

import { getSourceLocation } from "../parser/getSourceLocation";

import type { ReferenceAnalysis } from "./ReferenceAnalysis";
import type { ReferenceTarget } from "./ReferenceTarget";
import { createReferenceAnchor } from "./createReferenceAnchor";

export function analyzeEquationReferences(
    source: string,
    filePath: string,
): ReferenceAnalysis {
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const labels = new Map<string, ReferenceTarget>();

    const equationPattern =
        /\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g;

    let equationNumber = 0;

    for (
        const equationMatch of
            source.matchAll(equationPattern)
    ) {
        equationNumber++;

        const completeEnvironment =
            equationMatch[0];

        const environmentContent =
            equationMatch[1];

        const environmentStart =
            equationMatch.index;

        const labelPattern =
            /\\label\{([^{}]*)\}/g;

        const labelMatches = [
            ...environmentContent.matchAll(
                labelPattern,
            ),
        ];

        if (labelMatches.length === 0) {
            continue;
        }

        if (labelMatches.length > 1) {
            for (
                const extraLabel of
                    labelMatches.slice(1)
            ) {
                const absoluteIndex =
                    environmentStart +
                    completeEnvironment.indexOf(
                        extraLabel[0],
                    );

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
            environmentStart +
            completeEnvironment.indexOf(
                firstLabelMatch[0],
            );

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

            continue;
        }

        if (!label.startsWith("eq:")) {
            diagnostics.push({
                severity: "warning",
                message:
                    `Equation label "${label}" should begin with "eq:".`,
                filePath,
                location: getSourceLocation(
                    source,
                    labelIndex,
                ),
            });
        }

        const existingTarget =
            labels.get(label);

        if (existingTarget) {
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

            continue;
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

        labels.set(label, target);
        targets.push(target);
    }

    return {
        targets,
        diagnostics,
    };
}