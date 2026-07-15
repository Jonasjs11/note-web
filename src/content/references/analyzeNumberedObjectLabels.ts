import type { Diagnostic } from "../models/Diagnostic";

import { getSourceLocation } from "../parser/getSourceLocation";

import { createReferenceAnchor } from "./createReferenceAnchor";
import type {
    ReferenceNumber,
    ReferenceTarget,
} from "./ReferenceTarget";

export type NumberedObjectDescription =
    | "equation"
    | "align row";

interface AnalyzeNumberedObjectLabelsOptions {
    completeSource: string;
    filePath: string;

    objectSource: string;
    objectStart: number;
    number: ReferenceNumber;

    objectDescription:
        NumberedObjectDescription;

    targetsByLabel: Map<
        string,
        ReferenceTarget
    >;

    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}

export function analyzeNumberedObjectLabels({
    completeSource,
    filePath,
    objectSource,
    objectStart,
    number,
    objectDescription,
    targetsByLabel,
    targets,
    diagnostics,
}: AnalyzeNumberedObjectLabelsOptions): void {
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
                    completeSource,
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
                completeSource,
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
                completeSource,
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
                completeSource,
                labelIndex,
            ),
        });

        return;
    }

    const target: ReferenceTarget = {
        label,
        type: "equation",
        number,
        anchorId: `mjx-eqn:${label}`,
    };

    targetsByLabel.set(label, target);
    targets.push(target);
}