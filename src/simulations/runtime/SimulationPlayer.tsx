import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    CSSProperties,
} from "react";

import {
    getSimulationLoader,
    loadSimulation,
} from "../registry/simulationRegistry";

import {
    CanvasGraphics,
} from "./CanvasGraphics";

import type {
    RuntimeSimulationDefinition,
} from "./defineSimulation";

import {
    createDefaultParameterValues,
} from "./parameterDefinitions";

import {
    compileSimulationFunctions,
    createDefaultFunctionExpressions,
} from "./functionDefinitions";

import type {
    RuntimeSimulationFunctions,
} from "./functionDefinitions";

import FunctionInputs
    from "./FunctionInputs";

import {
    readSimulationPalette,
} from "./readSimulationPalette";

import SimulationControls
    from "./SimulationControls";

import type {
    RuntimeParameterValues,
    SimulationParameterValue,
} from "./simulationTypes";

import {
    Viewport2D,
} from "./Viewport2D";

import "./SimulationPlayer.css";

interface SimulationPlayerProps {
    simulationId: string;
}

export default function SimulationPlayer({
    simulationId,
}: SimulationPlayerProps) {
    const rootRef =
        useRef<HTMLElement>(null);

    const canvasContainerRef =
        useRef<HTMLDivElement>(null);

    const canvasRef =
        useRef<HTMLCanvasElement>(null);

    const graphicsRef =
        useRef<CanvasGraphics | undefined>(
            undefined,
        );

    const stateRef =
        useRef<unknown>(undefined);

    const parametersRef =
        useRef<RuntimeParameterValues>({});

    const functionsRef =
        useRef<RuntimeSimulationFunctions>({});

    const elapsedTimeRef =
        useRef(0);

    const frameRequestRef =
        useRef<number | undefined>(
            undefined,
        );

    const pendingPlayRef =
        useRef(false);

    const [definition, setDefinition] =
        useState<RuntimeSimulationDefinition>();

    const [parameters, setParameters] =
        useState<RuntimeParameterValues>({});

    const [functionExpressions, setFunctionExpressions] =
        useState<Record<string, string>>({});

    const [isPlaying, setIsPlaying] =
        useState(false);

    const [isVisible, setIsVisible] =
        useState(() => {
            return typeof IntersectionObserver ===
                "undefined";
        });

    const [isDocumentVisible, setIsDocumentVisible] =
        useState(() => {
            return typeof document === "undefined"
                ? true
                : !document.hidden;
        });

    const [canvasRevision, setCanvasRevision] =
        useState(0);

    const [stateResetRevision, setStateResetRevision] =
        useState(0);

    const [error, setError] =
        useState<string>();

    const loaderExists =
        getSimulationLoader(simulationId) !==
        undefined;

    const compiledFunctions = useMemo(
        () =>
            compileSimulationFunctions(
                definition?.functionInputs ?? {},
                functionExpressions,
            ),
        [definition, functionExpressions],
    );

    const reportRuntimeError =
        useCallback((message: string) => {
            setError(message);
            setIsPlaying(false);
        }, []);

    const loadDefinition = useCallback(
        async () => {
            if (definition || error) {
                return;
            }

            try {
                const loadedDefinition =
                    await loadSimulation(
                        simulationId,
                    );

                setDefinition(
                    loadedDefinition,
                );

                setParameters(
                    createDefaultParameterValues(
                        loadedDefinition.parameters,
                    ),
                );

                setFunctionExpressions(
                    createDefaultFunctionExpressions(
                        loadedDefinition.functionInputs,
                    ),
                );

                if (pendingPlayRef.current) {
                    pendingPlayRef.current =
                        false;
                    setIsPlaying(true);
                }
            } catch (loadError: unknown) {
                setError(
                    getErrorMessage(loadError),
                );
                pendingPlayRef.current =
                    false;
            }
        },
        [definition, error, simulationId],
    );

    useEffect(() => {
        const root = rootRef.current;

        if (!root) {
            return;
        }

        if (
            typeof IntersectionObserver ===
            "undefined"
        ) {
            if (loaderExists) {
                queueMicrotask(() => {
                    void loadDefinition();
                });
            }

            return;
        }

        const scrollRoot =
            root.closest<HTMLElement>(
                ".note-content-holder",
            );

        const preloadObserver =
            new IntersectionObserver(
                ([entry]) => {
                    if (
                        entry.isIntersecting &&
                        loaderExists
                    ) {
                        void loadDefinition();
                    }
                },
                {
                    root: scrollRoot,
                    rootMargin:
                        "600px 0px 600px 0px",
                },
            );

        const visibilityObserver =
            new IntersectionObserver(
                ([entry]) => {
                    setIsVisible(
                        entry.isIntersecting,
                    );
                },
                {
                    root: scrollRoot,
                    threshold: 0.01,
                },
            );

        preloadObserver.observe(root);
        visibilityObserver.observe(root);

        return () => {
            preloadObserver.disconnect();
            visibilityObserver.disconnect();
        };
    }, [loaderExists, loadDefinition]);

    useEffect(() => {
        function handleVisibilityChange() {
            setIsDocumentVisible(
                !document.hidden,
            );
        }

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, []);

    useEffect(() => {
        function handleThemeChange() {
            const root = rootRef.current;
            const graphics =
                graphicsRef.current;

            if (!root || !graphics) {
                return;
            }

            graphics.setPalette(
                readSimulationPalette(root),
            );

            setCanvasRevision(
                (revision) => revision + 1,
            );
        }

        window.addEventListener(
            "note-web:theme-change",
            handleThemeChange,
        );

        return () => {
            window.removeEventListener(
                "note-web:theme-change",
                handleThemeChange,
            );
        };
    }, []);

    useLayoutEffect(() => {
        if (
            !definition ||
            error ||
            !canvasRef.current ||
            !canvasContainerRef.current ||
            !rootRef.current
        ) {
            return;
        }

        const canvas = canvasRef.current;
        const container =
            canvasContainerRef.current;

        const palette =
            readSimulationPalette(
                rootRef.current,
            );

        const graphics =
            new CanvasGraphics(
                canvas,
                palette,
            );

        graphicsRef.current = graphics;

        const resizeObserver =
            new ResizeObserver(() => {
                const width =
                    container.clientWidth;

                const height = Math.max(
                    180,
                    width /
                        definition.aspectRatio,
                );

                graphics.resize(
                    width,
                    height,
                    Math.min(
                        window.devicePixelRatio || 1,
                        2,
                    ),
                );

                setCanvasRevision(
                    (revision) =>
                        revision + 1,
                );
            });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            graphicsRef.current =
                undefined;
        };
    }, [definition, error]);

    useEffect(() => {
        parametersRef.current = parameters;
        functionsRef.current = compiledFunctions;
    }, [parameters, compiledFunctions]);

    useEffect(() => {
        if (!definition) {
            return;
        }

        stateRef.current =
            definition.createState(
                parametersRef.current,
                functionsRef.current,
            );
        elapsedTimeRef.current = 0;

        drawCurrentFrame(
            definition,
            graphicsRef.current,
            stateRef.current,
            parametersRef.current,
            functionsRef.current,
            elapsedTimeRef.current,
            reportRuntimeError,
        );
    }, [
        definition,
        stateResetRevision,
        reportRuntimeError,
    ]);

    useEffect(() => {
        if (!definition) {
            return;
        }

        drawCurrentFrame(
            definition,
            graphicsRef.current,
            stateRef.current,
            parametersRef.current,
            functionsRef.current,
            elapsedTimeRef.current,
            reportRuntimeError,
        );
    }, [
        definition,
        parameters,
        compiledFunctions,
        canvasRevision,
        reportRuntimeError,
    ]);

    useEffect(() => {
        if (
            !definition ||
            !isPlaying ||
            !isVisible ||
            !isDocumentVisible
        ) {
            return;
        }

        const activeDefinition =
            definition;

        let previousTimestamp:
            number | undefined;
        let accumulator = 0;
        let cancelled = false;

        const fixedTimeStep =
            activeDefinition.fixedTimeStep;

        function frame(
            timestamp: number,
        ) {
            if (cancelled) {
                return;
            }

            if (
                previousTimestamp ===
                undefined
            ) {
                previousTimestamp =
                    timestamp;
            }

            const frameDelta = Math.min(
                activeDefinition.maxFrameDelta,
                Math.max(
                    0,
                    (timestamp -
                        previousTimestamp) /
                        1000,
                ),
            );

            previousTimestamp = timestamp;
            accumulator += frameDelta;

            try {
                if (
                    stateRef.current ===
                    undefined
                ) {
                    stateRef.current =
                        activeDefinition.createState(
                            parametersRef.current,
                            functionsRef.current,
                        );
                }

                let steps = 0;

                while (
                    accumulator >=
                        fixedTimeStep &&
                    steps < 24
                ) {
                    const activeState =
                        stateRef.current;

                    activeDefinition.updateState(
                        activeState,
                        parametersRef.current,
                        fixedTimeStep,
                        elapsedTimeRef.current +
                            fixedTimeStep,
                        functionsRef.current,
                    );

                    elapsedTimeRef.current +=
                        fixedTimeStep;

                    accumulator -=
                        fixedTimeStep;
                    steps++;

                    if (
                        activeDefinition.isStateComplete(
                            activeState,
                            parametersRef.current,
                            elapsedTimeRef.current,
                            functionsRef.current,
                        )
                    ) {
                        setIsPlaying(false);
                        return;
                    }
                }

                if (steps === 24) {
                    accumulator = 0;
                }

                drawCurrentFrame(
                    activeDefinition,
                    graphicsRef.current,
                    stateRef.current,
                    parametersRef.current,
                    functionsRef.current,
                    elapsedTimeRef.current,
                    reportRuntimeError,
                );
            } catch (runtimeError: unknown) {
                setError(
                    getErrorMessage(
                        runtimeError,
                    ),
                );
                setIsPlaying(false);
                return;
            }

            frameRequestRef.current =
                requestAnimationFrame(frame);
        }

        frameRequestRef.current =
            requestAnimationFrame(frame);

        return () => {
            cancelled = true;

            if (
                frameRequestRef.current !==
                undefined
            ) {
                cancelAnimationFrame(
                    frameRequestRef.current,
                );
            }
        };
    }, [
        definition,
        isPlaying,
        isVisible,
        isDocumentVisible,
        reportRuntimeError,
    ]);

    function handleStart() {
        if (!loaderExists) {
            setError(
                `Unknown simulation "${simulationId}".`,
            );
            return;
        }

        if (definition) {
            setIsPlaying(true);
            return;
        }

        pendingPlayRef.current = true;
        void loadDefinition();
    }

    function handleReset() {
        if (!definition) {
            return;
        }

        setIsPlaying(false);
        stateRef.current =
            definition.createState(
                parametersRef.current,
                functionsRef.current,
            );
        elapsedTimeRef.current = 0;

        drawCurrentFrame(
            definition,
            graphicsRef.current,
            stateRef.current,
            parametersRef.current,
            functionsRef.current,
            0,
            reportRuntimeError,
        );
    }

    function handleParameterChange(
        key: string,
        value: SimulationParameterValue,
    ) {
        setParameters(
            (currentParameters) => ({
                ...currentParameters,
                [key]: value,
            }),
        );

        if (
            definition?.parameters[key]
                ?.resetOnChange !== false
        ) {
            setStateResetRevision(
                (revision) => revision + 1,
            );
        }
    }

    function handleFunctionChange(
        key: string,
        expression: string,
    ) {
        setFunctionExpressions(
            (currentExpressions) => ({
                ...currentExpressions,
                [key]: expression,
            }),
        );

        if (
            definition?.functionInputs[key]
                ?.resetOnChange !== false
        ) {
            setStateResetRevision(
                (revision) => revision + 1,
            );
        }
    }

    const title =
        definition?.title ??
        formatSimulationId(simulationId);

    const style = definition
        ? ({
              "--simulation-aspect-ratio":
                  definition.aspectRatio,
          } as CSSProperties)
        : undefined;

    return (
        <figure
            ref={rootRef}
            className="simulation-player"
            style={style}
        >
            <figcaption className="simulation-player__header">
                <div>
                    <div className="simulation-player__title">
                        {title}
                    </div>

                    {definition?.description && (
                        <div className="simulation-player__description">
                            {definition.description}
                        </div>
                    )}
                </div>

                <span className="simulation-player__status">
                    {error
                        ? "Error"
                        : isPlaying
                          ? isVisible &&
                            isDocumentVisible
                              ? "Running"
                              : "Paused offscreen"
                          : definition
                            ? "Ready"
                            : "Not loaded"}
                </span>
            </figcaption>

            {error ? (
                <div
                    className="simulation-player__error"
                    role="alert"
                >
                    {error}
                </div>
            ) : definition ? (
                <>
                    <div
                        ref={canvasContainerRef}
                        className="simulation-player__canvas-container"
                    >
                        <canvas
                            ref={canvasRef}
                            className="simulation-player__canvas"
                            aria-label={
                                definition.description ??
                                `${definition.title} simulation`
                            }
                        >
                            Your browser does not support Canvas 2D.
                        </canvas>
                    </div>

                    <div className="simulation-player__toolbar">
                        <button
                            type="button"
                            className="simulation-player__button simulation-player__button--primary"
                            onClick={() => {
                                if (isPlaying) {
                                    setIsPlaying(false);
                                    return;
                                }

                                const state =
                                    stateRef.current;

                                if (
                                    state !== undefined &&
                                    definition.isStateComplete(
                                        state,
                                        parametersRef.current,
                                        elapsedTimeRef.current,
                                        functionsRef.current,
                                    )
                                ) {
                                    stateRef.current =
                                        definition.createState(
                                            parametersRef.current,
                                            functionsRef.current,
                                        );
                                    elapsedTimeRef.current = 0;
                                }

                                setIsPlaying(true);
                            }}
                        >
                            {isPlaying
                                ? "Pause"
                                : "Play"}
                        </button>

                        <button
                            type="button"
                            className="simulation-player__button"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>

                    <FunctionInputs
                        definitions={
                            definition.functionInputs
                        }
                        expressions={
                            functionExpressions
                        }
                        functions={
                            compiledFunctions
                        }
                        onChange={
                            handleFunctionChange
                        }
                    />

                    <SimulationControls
                        definitions={
                            definition.parameters
                        }
                        values={parameters}
                        onChange={
                            handleParameterChange
                        }
                    />
                </>
            ) : (
                <div className="simulation-player__placeholder">
                    <div className="simulation-player__placeholder-graphic" />

                    <button
                        type="button"
                        className="simulation-player__button simulation-player__button--primary"
                        disabled={!loaderExists}
                        onClick={handleStart}
                    >
                        {loaderExists
                            ? "Start simulation"
                            : "Simulation unavailable"}
                    </button>
                </div>
            )}
        </figure>
    );
}

function drawCurrentFrame(
    definition:
        RuntimeSimulationDefinition,
    graphics: CanvasGraphics | undefined,
    state: unknown,
    parameters: RuntimeParameterValues,
    functions: RuntimeSimulationFunctions,
    elapsedTime: number,
    reportError: (
        message: string,
    ) => void,
) {
    if (
        !graphics ||
        state === undefined
    ) {
        return;
    }

    try {
        const axes = definition.getAxes(
            state,
            parameters,
            functions,
            elapsedTime,
        );

        const authoredBounds =
            definition.getWorldBounds(
                state,
                parameters,
                functions,
            );

        const bounds = axes
            ? {
                  ...authoredBounds,
                  padding: Math.max(
                      authoredBounds.padding ?? 28,
                      getMinimumAxisPadding(axes),
                  ),
              }
            : authoredBounds;

        const viewport = new Viewport2D(
            graphics.width,
            graphics.height,
            bounds,
        );

        definition.drawState({
            graphics,
            viewport,
            state,
            parameters,
            functions,
            elapsedTime,
        });

        drawConfiguredFunctions(
            definition,
            graphics,
            viewport,
            functions,
        );

        if (axes) {
            graphics.axes(
                viewport,
                axes,
            );
        }
    } catch (drawError: unknown) {
        reportError(
            getErrorMessage(drawError),
        );
    }
}

function drawConfiguredFunctions(
    definition:
        RuntimeSimulationDefinition,
    graphics: CanvasGraphics,
    viewport: Viewport2D,
    functions:
        RuntimeSimulationFunctions,
) {
    for (const [key, functionDefinition] of
        Object.entries(
            definition.functionInputs,
        )) {
        const functionValue = functions[key];

        if (
            functionDefinition.autoDraw === false ||
            !functionValue ||
            functionValue.error
        ) {
            continue;
        }

        graphics.functionGraph(
            viewport,
            functionValue.evaluate,
            {
                domain:
                    functionDefinition.domain,
                samples:
                    functionDefinition.samples,
                color:
                    functionDefinition.color,
                width:
                    functionDefinition.lineWidth,
                pattern:
                    functionDefinition.linePattern,
            },
        );
    }
}


function getMinimumAxisPadding(
    axes: import("./simulationTypes").SimulationAxesDefinition,
): number {
    const axisDefinitions = [
        axes.x,
        axes.y,
    ].filter(
        (axis) => axis !== false && axis !== undefined,
    );

    if (axisDefinitions.length === 0) {
        return 28;
    }

    const hasTicks = axisDefinitions.some(
        (axis) => Boolean(axis?.ticks),
    );

    const hasLabels = axisDefinitions.some(
        (axis) => Boolean(axis?.label || axis?.unit),
    );

    if (hasTicks && hasLabels) {
        return 64;
    }

    if (hasTicks) {
        return 46;
    }

    if (hasLabels) {
        return 38;
    }

    return 28;
}

function formatSimulationId(
    id: string,
): string {
    return id
        .split("-")
        .filter(Boolean)
        .map(
            (part) =>
                part[0]?.toUpperCase() +
                part.slice(1),
        )
        .join(" ");
}

function getErrorMessage(
    error: unknown,
): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "The simulation failed to run.";
}
