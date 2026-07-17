import type {
    CanvasGraphics,
} from "./CanvasGraphics";

import type {
    RuntimeSimulationFunctions,
    SimulationFunctionDefinitions,
    SimulationFunctionValues,
} from "./functionDefinitions";

import type {
    Viewport2D,
} from "./Viewport2D";

import type {
    RuntimeParameterValues,
    SimulationAxesDefinition,
    SimulationParameterDefinitions,
    SimulationParameterValues,
    WorldBounds,
} from "./simulationTypes";

export interface SimulationDrawContext<
    State,
    Definitions extends
        SimulationParameterDefinitions,
    FunctionDefinitions extends
        SimulationFunctionDefinitions,
> {
    graphics: CanvasGraphics;
    viewport: Viewport2D;
    state: State;
    parameters:
        SimulationParameterValues<Definitions>;
    functions:
        SimulationFunctionValues<FunctionDefinitions>;
    elapsedTime: number;
}

export interface SimulationDefinition<
    Definitions extends
        SimulationParameterDefinitions,
    State,
    FunctionDefinitions extends
        SimulationFunctionDefinitions = {},
> {
    id: string;
    title: string;
    description?: string;

    aspectRatio?: number;
    fixedTimeStep?: number;
    maxFrameDelta?: number;

    parameters: Definitions;
    functionInputs?: FunctionDefinitions;

    /**
     * Optional runtime-rendered axes. Ticks and units are configured here,
     * so individual simulations do not need to implement them.
     */
    axes?:
        | SimulationAxesDefinition
        | ((
              state: State,
              parameters:
                  SimulationParameterValues<Definitions>,
              functions:
                  SimulationFunctionValues<FunctionDefinitions>,
              elapsedTime: number,
          ) => SimulationAxesDefinition | undefined);

    world:
        | WorldBounds
        | ((
              state: State,
              parameters:
                  SimulationParameterValues<Definitions>,
              functions:
                  SimulationFunctionValues<FunctionDefinitions>,
          ) => WorldBounds);

    create(
        parameters:
            SimulationParameterValues<Definitions>,
        functions:
            SimulationFunctionValues<FunctionDefinitions>,
    ): State;

    update(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        deltaTime: number,
        elapsedTime: number,
        functions:
            SimulationFunctionValues<FunctionDefinitions>,
    ): void;

    draw(
        context:
            SimulationDrawContext<
                State,
                Definitions,
                FunctionDefinitions
            >,
    ): void;

    isComplete?(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        elapsedTime: number,
        functions:
            SimulationFunctionValues<FunctionDefinitions>,
    ): boolean;

    describe?(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        elapsedTime: number,
        functions:
            SimulationFunctionValues<FunctionDefinitions>,
    ): string;
}

export interface RuntimeSimulationDefinition {
    id: string;
    title: string;
    description?: string;

    aspectRatio: number;
    fixedTimeStep: number;
    maxFrameDelta: number;

    parameters:
        SimulationParameterDefinitions;

    functionInputs:
        SimulationFunctionDefinitions;

    getAxes(
        state: unknown,
        parameters: RuntimeParameterValues,
        functions:
            RuntimeSimulationFunctions,
        elapsedTime: number,
    ): SimulationAxesDefinition | undefined;

    createState(
        parameters: RuntimeParameterValues,
        functions:
            RuntimeSimulationFunctions,
    ): unknown;

    updateState(
        state: unknown,
        parameters: RuntimeParameterValues,
        deltaTime: number,
        elapsedTime: number,
        functions:
            RuntimeSimulationFunctions,
    ): void;

    drawState(context: {
        graphics: CanvasGraphics;
        viewport: Viewport2D;
        state: unknown;
        parameters: RuntimeParameterValues;
        functions:
            RuntimeSimulationFunctions;
        elapsedTime: number;
    }): void;

    getWorldBounds(
        state: unknown,
        parameters: RuntimeParameterValues,
        functions:
            RuntimeSimulationFunctions,
    ): WorldBounds;

    isStateComplete(
        state: unknown,
        parameters: RuntimeParameterValues,
        elapsedTime: number,
        functions:
            RuntimeSimulationFunctions,
    ): boolean;

    describeState(
        state: unknown,
        parameters: RuntimeParameterValues,
        elapsedTime: number,
        functions:
            RuntimeSimulationFunctions,
    ): string | undefined;
}

export interface SimulationModule {
    default: RuntimeSimulationDefinition;
}

export function defineSimulation<
    const Definitions extends
        SimulationParameterDefinitions,
    State,
    const FunctionDefinitions extends
        SimulationFunctionDefinitions = {},
>(
    definition:
        SimulationDefinition<
            Definitions,
            State,
            FunctionDefinitions
        >,
): RuntimeSimulationDefinition {
    return {
        id: definition.id,
        title: definition.title,
        description: definition.description,

        aspectRatio:
            definition.aspectRatio ?? 16 / 9,
        fixedTimeStep:
            definition.fixedTimeStep ?? 1 / 120,
        maxFrameDelta:
            definition.maxFrameDelta ?? 0.1,

        parameters: definition.parameters,
        functionInputs:
            definition.functionInputs ?? {},
        getAxes(
            state,
            parameters,
            functions,
            elapsedTime,
        ) {
            if (!definition.axes) {
                return undefined;
            }

            if (typeof definition.axes !== "function") {
                return definition.axes;
            }

            return definition.axes(
                state as State,
                parameters as
                    SimulationParameterValues<Definitions>,
                functions as
                    SimulationFunctionValues<FunctionDefinitions>,
                elapsedTime,
            );
        },

        createState(
            parameters,
            functions,
        ) {
            return definition.create(
                parameters as
                    SimulationParameterValues<Definitions>,
                functions as
                    SimulationFunctionValues<FunctionDefinitions>,
            );
        },

        updateState(
            state,
            parameters,
            deltaTime,
            elapsedTime,
            functions,
        ) {
            definition.update(
                state as State,
                parameters as
                    SimulationParameterValues<Definitions>,
                deltaTime,
                elapsedTime,
                functions as
                    SimulationFunctionValues<FunctionDefinitions>,
            );
        },

        drawState({
            graphics,
            viewport,
            state,
            parameters,
            functions,
            elapsedTime,
        }) {
            definition.draw({
                graphics,
                viewport,
                state: state as State,
                parameters:
                    parameters as
                        SimulationParameterValues<Definitions>,
                functions:
                    functions as
                        SimulationFunctionValues<FunctionDefinitions>,
                elapsedTime,
            });
        },

        getWorldBounds(
            state,
            parameters,
            functions,
        ) {
            const typedParameters =
                parameters as
                    SimulationParameterValues<Definitions>;

            const typedFunctions =
                functions as
                    SimulationFunctionValues<FunctionDefinitions>;

            return typeof definition.world ===
                "function"
                ? definition.world(
                      state as State,
                      typedParameters,
                      typedFunctions,
                  )
                : definition.world;
        },

        isStateComplete(
            state,
            parameters,
            elapsedTime,
            functions,
        ) {
            return (
                definition.isComplete?.(
                    state as State,
                    parameters as
                        SimulationParameterValues<Definitions>,
                    elapsedTime,
                    functions as
                        SimulationFunctionValues<FunctionDefinitions>,
                ) ?? false
            );
        },

        describeState(
            state,
            parameters,
            elapsedTime,
            functions,
        ) {
            return definition.describe?.(
                state as State,
                parameters as
                    SimulationParameterValues<Definitions>,
                elapsedTime,
                functions as
                    SimulationFunctionValues<FunctionDefinitions>,
            );
        },
    };
}
