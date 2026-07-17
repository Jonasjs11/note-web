import {
    compileMathExpression,
} from "./mathExpression";

import type {
    SimulationPalette,
} from "./CanvasGraphics";

import type {
    SimulationStrokePattern,
} from "./simulationTypes";

export type SimulationGraphColor =
    | keyof SimulationPalette
    | string;

export interface SimulationFunctionDomain {
    min: number;
    max: number;
}

export interface SimulationFunctionInputDefinition {
    /** Text shown to the left of the input, for example "y(x)=". */
    label: string;

    /** Independent variable accepted by the expression parser. */
    variable: string;

    /** Initial right-hand-side expression. */
    initial: string;

    description?: string;
    placeholder?: string;

    /** Defaults to the visible viewport's x range. */
    domain?: SimulationFunctionDomain;

    /** Defaults to a value based on the canvas width. */
    samples?: number;

    color?: SimulationGraphColor;
    lineWidth?: number;
    linePattern?: SimulationStrokePattern;

    /** Defaults to true. Set false for a display-only graph overlay. */
    resetOnChange?: boolean;

    /** Defaults to true. Set false when the simulation draws it manually. */
    autoDraw?: boolean;
}

export type SimulationFunctionDefinitions =
    Record<
        string,
        SimulationFunctionInputDefinition
    >;

export interface RuntimeSimulationFunction {
    expression: string;
    variable: string;
    error?: string;
    evaluate(value: number): number;
}

export type RuntimeSimulationFunctions =
    Record<
        string,
        RuntimeSimulationFunction
    >;

export type SimulationFunctionValues<
    Definitions extends
        SimulationFunctionDefinitions,
> = {
    [Key in keyof Definitions]:
        RuntimeSimulationFunction;
};

export function functionInput<
    const Definition extends
        SimulationFunctionInputDefinition,
>(
    definition: Definition,
): Definition {
    return definition;
}

export function createDefaultFunctionExpressions(
    definitions:
        SimulationFunctionDefinitions,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(definitions).map(
            ([key, definition]) => [
                key,
                definition.initial,
            ],
        ),
    );
}

export function compileSimulationFunctions(
    definitions:
        SimulationFunctionDefinitions,
    expressions: Record<string, string>,
): RuntimeSimulationFunctions {
    return Object.fromEntries(
        Object.entries(definitions).map(
            ([key, definition]) => {
                const expression =
                    expressions[key] ??
                    definition.initial;

                try {
                    const compiled =
                        compileMathExpression(
                            expression,
                            definition.variable,
                        );

                    return [
                        key,
                        {
                            expression,
                            variable:
                                definition.variable,
                            evaluate:
                                compiled.evaluate,
                        } satisfies RuntimeSimulationFunction,
                    ];
                } catch (error: unknown) {
                    return [
                        key,
                        {
                            expression,
                            variable:
                                definition.variable,
                            error:
                                getErrorMessage(
                                    error,
                                ),
                            evaluate() {
                                return Number.NaN;
                            },
                        } satisfies RuntimeSimulationFunction,
                    ];
                }
            },
        ),
    );
}

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : "Invalid function.";
}
