import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createCalculatorToken,
} from "../commands/CommandToken";

import {
    getSourceLocation,
} from "../parser/getSourceLocation";

import {
    parseCalculatorDefinition,
} from "../../calculators/CalculatorExpression";

import type {
    SourceTransformContext,
} from "./Transformer";

interface CalculatorEnvironmentOptions {
    precision: number;
    defaultFormat: "decimal" | "scientific";
    preview: boolean;
    defaultAngleMode: "radians" | "degrees";
    angleLocked: boolean;
}

const defaultOptions: CalculatorEnvironmentOptions = {
    precision: 6,
    defaultFormat: "decimal",
    preview: false,
    defaultAngleMode: "radians",
    angleLocked: false,
};

const calculatorPattern =
    /\\begin\{calculator\}(?:\[([^\]\n]*)\])?([\s\S]*?)\\end\{calculator\}/g;

export function transformCalculatorEnvironments(
    source: string,
    filePath: string,
    _context: SourceTransformContext,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const value = source.replace(
        calculatorPattern,
        (
            _completeEnvironment: string,
            optionsSource: string | undefined,
            calculatorSource: string,
            offset: number,
        ) => {
            const options = parseOptions(
                optionsSource ?? "",
                source,
                offset,
                filePath,
                diagnostics,
            );
            const trimmedCalculatorSource =
                calculatorSource.trim();

            if (
                !trimmedCalculatorSource &&
                options.angleLocked
            ) {
                diagnostics.push({
                    severity: "warning",
                    message:
                        "Calculator angle-lock only applies to predefined formulas; blank calculators remain unlocked.",
                    filePath,
                    location: getSourceLocation(
                        source,
                        offset,
                    ),
                });
            }

            if (trimmedCalculatorSource) {
                try {
                    parseCalculatorDefinition(
                        trimmedCalculatorSource,
                    );
                } catch (error: unknown) {
                    diagnostics.push({
                        severity: "error",
                        message:
                            error instanceof Error
                                ? `Invalid calculator: ${error.message}`
                                : "Invalid calculator formula.",
                        filePath,
                        location: getSourceLocation(
                            source,
                            offset,
                        ),
                    });
                }
            }

            return (
                "\n\n" +
                createCalculatorToken({
                    source: trimmedCalculatorSource,
                    precision: options.precision,
                    defaultFormat:
                        options.defaultFormat,
                    preview: options.preview,
                    defaultAngleMode:
                        options.defaultAngleMode,
                    angleLocked:
                        Boolean(trimmedCalculatorSource) &&
                        options.angleLocked,
                }) +
                "\n\n"
            );
        },
    );

    return {
        value,
        diagnostics,
    };
}

function parseOptions(
    source: string,
    completeSource: string,
    environmentOffset: number,
    filePath: string,
    diagnostics: Diagnostic[],
): CalculatorEnvironmentOptions {
    const options = { ...defaultOptions };
    const trimmedSource = source.trim();

    if (!trimmedSource) {
        return options;
    }

    for (const part of trimmedSource.split(",")) {
        const trimmedPart = part.trim();
        if (!trimmedPart) {
            continue;
        }

        const equalsIndex = trimmedPart.indexOf("=");
        if (equalsIndex < 0) {
            addOptionDiagnostic(
                `Calculator option "${trimmedPart}" needs a value.`,
            );
            continue;
        }

        const key = trimmedPart
            .slice(0, equalsIndex)
            .trim()
            .toLowerCase();
        const value = trimmedPart
            .slice(equalsIndex + 1)
            .trim()
            .toLowerCase();

        if (key === "precision") {
            const precision = Number(value);
            if (
                !Number.isInteger(precision) ||
                precision < 1 ||
                precision > 15
            ) {
                addOptionDiagnostic(
                    "Calculator precision must be an integer from 1 to 15.",
                );
            } else {
                options.precision = precision;
            }
            continue;
        }

        if (key === "format") {
            if (
                value === "decimal" ||
                value === "scientific"
            ) {
                options.defaultFormat = value;
            } else {
                addOptionDiagnostic(
                    'Calculator format must be "decimal" or "scientific".',
                );
            }
            continue;
        }

        if (key === "preview") {
            if (value === "true" || value === "false") {
                options.preview = value === "true";
            } else {
                addOptionDiagnostic(
                    'Calculator preview must be "true" or "false".',
                );
            }
            continue;
        }

        if (key === "angle") {
            if (value === "rad" || value === "radian" || value === "radians") {
                options.defaultAngleMode = "radians";
            } else if (value === "deg" || value === "degree" || value === "degrees") {
                options.defaultAngleMode = "degrees";
            } else {
                addOptionDiagnostic(
                    'Calculator angle must be "rad" or "deg".',
                );
            }
            continue;
        }

        if (key === "angle-lock") {
            if (value === "true" || value === "false") {
                options.angleLocked = value === "true";
            } else {
                addOptionDiagnostic(
                    'Calculator angle-lock must be "true" or "false".',
                );
            }
            continue;
        }

        addOptionDiagnostic(
            `Unknown calculator option "${key}".`,
            "warning",
        );
    }

    return options;

    function addOptionDiagnostic(
        message: string,
        severity: "error" | "warning" = "error",
    ): void {
        diagnostics.push({
            severity,
            message,
            filePath,
            location: getSourceLocation(
                completeSource,
                environmentOffset,
            ),
        });
    }
}
