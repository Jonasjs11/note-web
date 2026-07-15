import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createReferenceAnchorToken,
    createReferenceToken,
} from "../commands/CommandToken";

import { findClosestMatch } from "../diagnostics/findClosestMatch";
import { getSourceLocation } from "../parser/getSourceLocation";

import type { SourceTransformContext } from "./Transformer";
import { transformMarkdownText } from "./transformMarkdownText";

import type { ReferenceRegistry } from "../references/ReferenceRegistry";

export function transformReferenceCommands(
    source: string,
    filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const registry = context.referenceRegistry;

    let transformedSource = transformMarkdownText(
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

    transformedSource = addEquationAnchors(
        transformedSource,
        registry,
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
            rawLabel: string,
            matchIndex: number,
        ) => {
            const label = rawLabel.trim();

            const absoluteMatchIndex =
                sourceOffset + matchIndex;

            if (!label) {
                diagnostics.push({
                    severity: "error",
                    message:
                        "A reference command must contain a label.",
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        absoluteMatchIndex,
                    ),
                });

                return fullMatch;
            }

            const target = registry.find(label);

            if (!target) {
                const suggestion =
                    findClosestMatch(
                        label,
                        [
                            ...registry.labels(),
                        ],
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

                return fullMatch;
            }

            const text =
                formatReferenceText(
                    target,
                    capitalization === "C",
                );

            return createReferenceToken({
                anchorId: target.anchorId,
                text,
            });
        },
    );
}

function addEquationAnchors(
    source: string,
    registry: ReferenceRegistry,
): string {
    const equationPattern =
        /\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g;

    return source.replace(
        equationPattern,
        (environment: string) => {
            const labelMatch =
                environment.match(
                    /\\label\{([^{}]*)\}/,
                );

            if (!labelMatch) {
                return environment;
            }

            const label = labelMatch[1].trim();

            const target = registry.find(label);

            if (!target) {
                return environment;
            }

            return (
                "\n\n" +
                createReferenceAnchorToken(
                    target.anchorId,
                ) +
                "\n\n" +
                environment
            );
        },
    );
}

function formatReferenceText(
    target: ReferenceTarget,
    capitalize: boolean,
): string {
    const typeName =
        getReferenceTypeName(target);

    const number =
        formatReferenceNumber(
            target.number,
        );

    const text = `${typeName} ${number}`;

    if (!capitalize) {
        return text;
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}

function getReferenceTypeName(
    target: ReferenceTarget,
): string {
    switch (target.type) {
        case "equation":
            return "equation";

        case "figure":
            return "figure";

        case "table":
            return "table";

        case "section":
            return "section";
    }
}

function formatReferenceNumber(
    number: {
        primary: number;
        sub?: string;
    },
): string {
    return (
        number.primary.toString() +
        (number.sub ?? "")
    );
}