import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import { createConceptToken } from "../commands/CommandToken";
import { getSourceLocation } from "../parser/getSourceLocation";

import { transformMarkdownText } from "./transformMarkdownText";

export function transformConceptCommands(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const transformedSource = transformMarkdownText(
        source,
        (text, sourceOffset) => {
            return transformConceptsInText(
                text,
                filePath,
                source,
                sourceOffset,
                diagnostics,
            );
        },
    );

    return {
        value: transformedSource,
        diagnostics,
    };
}

function transformConceptsInText(
    text: string,
    filePath: string,
    completeSource: string,
    sourceOffset: number,
    diagnostics: Diagnostic[],
): string {
    const commandPattern =
        /\\concept\{([^{}]*)\}(?:\[([^\]]*)\])?/g;

    return text.replace(
        commandPattern,
        (
            fullMatch: string,
            rawId: string,
            rawAlias: string | undefined,
            matchIndex: number,
        ) => {
            const id = rawId.trim();
            const alias = rawAlias?.trim();

            const absoluteMatchIndex =
                sourceOffset + matchIndex;

            if (!id) {
                diagnostics.push({
                    severity: "error",
                    message:
                        "A concept command must contain a concept ID.",
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        absoluteMatchIndex,
                    ),
                });

                return fullMatch;
            }

            if (
                rawAlias !== undefined &&
                alias?.length === 0
            ) {
                diagnostics.push({
                    severity: "warning",
                    message:
                        "The concept alias is empty and will be ignored.",
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        absoluteMatchIndex,
                    ),
                });
            }

            return createConceptToken({
                id,
                alias:
                    alias && alias.length > 0
                        ? alias
                        : undefined,
            });
        },
    );
}