import type {
    CanvasGraphics,
} from "./CanvasGraphics";

import type {
    Viewport2D,
} from "./Viewport2D";

import type {
    RuntimeParameterValues,
    SimulationParameterDefinitions,
    SimulationParameterValues,
    WorldBounds,
} from "./simulationTypes";

export interface SimulationDrawContext<
    State,
    Definitions extends
        SimulationParameterDefinitions,
> {
    graphics: CanvasGraphics;
    viewport: Viewport2D;
    state: State;
    parameters:
        SimulationParameterValues<Definitions>;
    elapsedTime: number;
}

export interface SimulationDefinition<
    Definitions extends
        SimulationParameterDefinitions,
    State,
> {
    id: string;
    title: string;
    description?: string;

    aspectRatio?: number;
    fixedTimeStep?: number;
    maxFrameDelta?: number;

    parameters: Definitions;

    world:
        | WorldBounds
        | ((
              state: State,
              parameters:
                  SimulationParameterValues<Definitions>,
          ) => WorldBounds);

    create(
        parameters:
            SimulationParameterValues<Definitions>,
    ): State;

    update(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        deltaTime: number,
        elapsedTime: number,
    ): void;

    draw(
        context:
            SimulationDrawContext<
                State,
                Definitions
            >,
    ): void;

    isComplete?(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        elapsedTime: number,
    ): boolean;

    describe?(
        state: State,
        parameters:
            SimulationParameterValues<Definitions>,
        elapsedTime: number,
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

    createState(
        parameters: RuntimeParameterValues,
    ): unknown;

    updateState(
        state: unknown,
        parameters: RuntimeParameterValues,
        deltaTime: number,
        elapsedTime: number,
    ): void;

    drawState(context: {
        graphics: CanvasGraphics;
        viewport: Viewport2D;
        state: unknown;
        parameters: RuntimeParameterValues;
        elapsedTime: number;
    }): void;

    getWorldBounds(
        state: unknown,
        parameters: RuntimeParameterValues,
    ): WorldBounds;

    isStateComplete(
        state: unknown,
        parameters: RuntimeParameterValues,
        elapsedTime: number,
    ): boolean;

    describeState(
        state: unknown,
        parameters: RuntimeParameterValues,
        elapsedTime: number,
    ): string | undefined;
}

export interface SimulationModule {
    default: RuntimeSimulationDefinition;
}

export function defineSimulation<
    const Definitions extends
        SimulationParameterDefinitions,
    State,
>(
    definition:
        SimulationDefinition<
            Definitions,
            State
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

        createState(parameters) {
            return definition.create(
                parameters as
                    SimulationParameterValues<Definitions>,
            );
        },

        updateState(
            state,
            parameters,
            deltaTime,
            elapsedTime,
        ) {
            definition.update(
                state as State,
                parameters as
                    SimulationParameterValues<Definitions>,
                deltaTime,
                elapsedTime,
            );
        },

        drawState({
            graphics,
            viewport,
            state,
            parameters,
            elapsedTime,
        }) {
            definition.draw({
                graphics,
                viewport,
                state: state as State,
                parameters:
                    parameters as
                        SimulationParameterValues<Definitions>,
                elapsedTime,
            });
        },

        getWorldBounds(
            state,
            parameters,
        ) {
            const typedParameters =
                parameters as
                    SimulationParameterValues<Definitions>;

            return typeof definition.world ===
                "function"
                ? definition.world(
                      state as State,
                      typedParameters,
                  )
                : definition.world;
        },

        isStateComplete(
            state,
            parameters,
            elapsedTime,
        ) {
            return (
                definition.isComplete?.(
                    state as State,
                    parameters as
                        SimulationParameterValues<Definitions>,
                    elapsedTime,
                ) ?? false
            );
        },

        describeState(
            state,
            parameters,
            elapsedTime,
        ) {
            return definition.describe?.(
                state as State,
                parameters as
                    SimulationParameterValues<Definitions>,
                elapsedTime,
            );
        },
    };
}
