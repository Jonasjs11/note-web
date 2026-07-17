import {
    createSimulationToken,
} from "../commands/CommandToken";

import {
    findClosestMatch,
} from "../diagnostics/findClosestMatch";

import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    getSourceLocation,
} from "../parser/getSourceLocation";

import {
    hasSimulation,
    listSimulationIds,
} from "../../simulations/registry/simulationRegistry";

import {
    transformMarkdownText,
} from "./transformMarkdownText";

export function transformSimulationCommands(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];

    const transformedSource =
        transformMarkdownText(
            source,
            (text, sourceOffset) => {
                return text.replace(
                    /\\simulation\{([^{}]*)\}/g,
                    (
                        completeCommand: string,
                        rawSimulationId: string,
                        matchOffset: number,
                    ) => {
                        const simulationId =
                            rawSimulationId.trim();

                        const location =
                            getSourceLocation(
                                source,
                                sourceOffset +
                                    matchOffset,
                            );

                        if (!simulationId) {
                            diagnostics.push({
                                severity: "error",
                                message:
                                    "A simulation command must contain an id.",
                                filePath,
                                location,
                            });

                            return completeCommand;
                        }

                        if (
                            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                                simulationId,
                            )
                        ) {
                            diagnostics.push({
                                severity: "error",
                                message:
                                    `Invalid simulation id "${simulationId}". ` +
                                    "Use lowercase words separated by hyphens.",
                                filePath,
                                location,
                            });
                        } else if (
                            !hasSimulation(
                                simulationId,
                            )
                        ) {
                            const suggestion =
                                findClosestMatch(
                                    simulationId,
                                    listSimulationIds(),
                                );

                            diagnostics.push({
                                severity: "error",
                                message:
                                    `Unknown simulation "${simulationId}".` +
                                    (suggestion
                                        ? ` Did you mean "${suggestion}"?`
                                        : ""),
                                filePath,
                                location,
                            });
                        }

                        return (
                            "\n\n" +
                            createSimulationToken(
                                simulationId,
                            ) +
                            "\n\n"
                        );
                    },
                );
            },
        );

    return {
        value: transformedSource,
        diagnostics,
    };
}
