import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createReferenceToken,
} from "../commands/CommandToken";

import { findClosestMatch } from "../diagnostics/findClosestMatch";
import { getSourceLocation } from "../parser/getSourceLocation";

import type { SourceTransformContext } from "./Transformer";
import { transformMarkdownText } from "./transformMarkdownText";

import type { ReferenceRegistry } from "../references/ReferenceRegistry";
import { formatReferenceNumber } from "../references/formatReferenceNumber";
import type { ReferenceTarget } from "../references/ReferenceTarget";

export function transformReferenceCommands(
    source: string,
    filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const registry = context.referenceRegistry;

    const transformedSource =
        transformMarkdownText(
            source,
            (text, sourceOffset) => {
                return transformReferencesInText(
                    text,
                    source,
                    filePath,
                    sourceOffset,
                    registry,
                    diagnostics,
                );
            },
        );

    return {
        value: transformedSource,
        diagnostics,
    };
}

function transformReferencesInText(
    text: string,
    completeSource: string,
    filePath: string,
    sourceOffset: number,
    registry: ReferenceRegistry,
    diagnostics: Diagnostic[],
): string {
    const referencePattern =
        /\\(c|C)ref\{([^{}]*)\}/g;

    return text.replace(
        referencePattern,
        (
            fullMatch: string,
            capitalization: "c" | "C",
            rawLabels: string,
            matchIndex: number,
        ) => {
            const absoluteMatchIndex =
                sourceOffset + matchIndex;

            const labels = rawLabels
                .split(",")
                .map((label) => label.trim())
                .filter(Boolean);

            if (labels.length === 0) {
                diagnostics.push({
                    severity: "error",
                    message:
                        "A reference command must contain at least one label.",
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        absoluteMatchIndex,
                    ),
                });

                return fullMatch;
            }

            const targets =
                registry.findMany(labels);

            let containsErrors = false;

            for (
                let index = 0;
                index < labels.length;
                index++
            ) {
                const label = labels[index];
                const target = targets[index];

                if (target) {
                    continue;
                }

                containsErrors = true;

                const suggestion =
                    findClosestMatch(
                        label,
                        registry.labels(),
                    );

                const suggestionText =
                    suggestion
                        ? ` Did you mean "${suggestion}"?`
                        : "";

                diagnostics.push({
                    severity: "error",
                    message:
                        `Unknown reference "${label}".` +
                        suggestionText,
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        absoluteMatchIndex,
                    ),
                });
            }

            if (containsErrors) {
                return fullMatch;
            }

            const validTargets = targets.filter(
                (
                    target,
                ): target is ReferenceTarget => {
                    return target !== undefined;
                },
            );

            return createReferenceToken({
                capitalize:
                    capitalization === "C",

                targets: validTargets.map(
                    (target) => ({
                        type: target.type,
                        anchorId:
                            target.anchorId,
                        number:
                            formatReferenceNumber(
                                target.number,
                            ),
                    }),
                ),
            });
        },
    );
}