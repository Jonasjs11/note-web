import type { Diagnostic } from "../models/Diagnostic";

import { getSourceLocation } from "../parser/getSourceLocation";

import type {
    ReferenceNumber,
    ReferenceTarget,
} from "./ReferenceTarget";

import {
    findLatexCommands,
} from "../parser/findLatexCommands";

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
}: AnalyzeNumberedObjectLabelsOptions): string | undefined {
    const labelMatches =
        findLatexCommands(
            objectSource,
            "label",
        );

    if (labelMatches.length === 0) {
        return undefined;
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
                        (extraLabel.startOffset ?? 0),
                ),
            });
        }
    }

    const firstLabelMatch =
        labelMatches[0];

    const label =
        firstLabelMatch.value.trim();

    const labelIndex =
        objectStart +
        (firstLabelMatch.startOffset);

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

        return undefined;
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

        return undefined;
    }

    const target: ReferenceTarget = {
        label,
        type: "equation",
        number,
        anchorId: `mjx-eqn:${label}`,
    };

    targetsByLabel.set(label, target);
    targets.push(target);
    
    return label;
}