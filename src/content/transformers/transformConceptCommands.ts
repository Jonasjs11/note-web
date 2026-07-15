import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import { createConceptPlaceholder } from "../commands/CommandPlaceholder";
import { getSourceLocation } from "../parser/getSourceLocation";

export function transformConceptCommands(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const commandPattern =
        /\\concept\{([^{}]*)\}(?:\[([^\]]*)\])?/g;

    const transformedSource = source.replace(
        commandPattern,
        (
            fullMatch: string,
            rawId: string,
            rawAlias: string | undefined,
            matchIndex: number,
        ) => {
            const id = rawId.trim();
            const alias = rawAlias?.trim();

            if (!id) {
                diagnostics.push({
                    severity: "error",
                    message:
                        "A concept command must contain a concept ID.",
                    filePath,
                    location: getSourceLocation(
                        source,
                        matchIndex,
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
                        source,
                        matchIndex,
                    ),
                });
            }

            return createConceptPlaceholder({
                id,
                alias:
                    alias && alias.length > 0
                        ? alias
                        : undefined,
            });
        },
    );

    return {
        value: transformedSource,
        diagnostics,
    };
}