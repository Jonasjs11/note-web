import {
    booleanParameter,
    defineSimulation,
    functionInput,
    rangeParameter,
    selectParameter,
} from "../../runtime";

interface TrajectoryPoint {
    time: number;
    x: number;
    y: number;
}

interface ProjectileState {
    time: number;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    trajectory: TrajectoryPoint[];
}

const parameters = {
    /* Physical parameters reset the simulation when changed. */
    speed: rangeParameter({
        label: "Initial speed",
        initial: 20,
        min: 1,
        max: 40,
        step: 1,
        unit: "m/s",
        description:
            "Magnitude of the initial velocity.",
        resetOnChange: true,
    }),

    angle: rangeParameter({
        label: "Launch angle",
        initial: 45,
        min: 5,
        max: 85,
        step: 1,
        unit: "°",
        description:
            "Angle above the horizontal.",
        resetOnChange: true,
    }),

    gravity: rangeParameter({
        label: "Gravity",
        initial: 9.81,
        min: 1,
        max: 20,
        step: 0.1,
        unit: "m/s²",
        description:
            "Downward acceleration.",
        resetOnChange: true,
    }),

    /* Display-only parameters redraw without resetting elapsed time. */
    coordinateSystem: selectParameter({
        label: "Coordinate system",
        initial: "position-height",
        options: [
            {
                value: "position-height",
                label: "(x, y)",
            },
            {
                value: "time-height",
                label: "(t, y)",
            },
        ],
        description:
            "Switch the horizontal coordinate without restarting the projectile.",
        resetOnChange: false,
    }),

    showVelocity: booleanParameter({
        label: "Show velocity vector",
        initial: true,
        resetOnChange: false,
    }),

    showTrajectory: booleanParameter({
        label: "Show simulated trajectory",
        initial: true,
        resetOnChange: false,
    }),
};

const functionInputs = {
    height: functionInput({
        label: "y(t)=",
        variable: "t",
        initial:
            "20*sin(pi/4)*t - 0.5*9.81*t^2",
        description:
            "A user-defined height function. It is plotted against t or converted to x = vₓt in the (x, y) view.",
        placeholder:
            "Use t, for example 12*t - 4.9*t^2",
        domain: {
            min: 0,
            max: 8,
        },
        samples: 480,
        color: "secondary",
        lineWidth: 2.25,
        linePattern: "dashed",
        resetOnChange: false,

        /* It is drawn manually because its horizontal coordinate changes. */
        autoDraw: false,
    }),
};

export default defineSimulation<
    typeof parameters,
    ProjectileState,
    typeof functionInputs
>({
    id: "projectile-motion",
    title: "Projectile motion",
    description:
        "A reference simulation demonstrating the complete Canvas 2D runtime API.",

    aspectRatio: 16 / 9,
    fixedTimeStep: 1 / 120,
    maxFrameDelta: 0.1,

    parameters,
    functionInputs,

    /* Axes may be static or calculated from state and parameters. */
    axes(_state, currentParameters) {
        const usesTime =
            currentParameters.coordinateSystem ===
            "time-height";

        return {
            x: {
                label: usesTime ? "t/s" : "x/m",
                labelStyle: "math",
                ticks: {
                    step: undefined,
                    size: 4,
                    decimals: undefined,
                    unit: usesTime ? "s" : "m",
                    showUnit: false,
                    stroke: {
                        color: undefined,
                        width: 1,
                        pattern: "solid",
                        dashOffset: 0,
                        alpha: 1,
                    },
                },
                stroke: {
                    color: undefined,
                    width: 1.25,
                    pattern: "solid",
                    dashOffset: 0,
                    alpha: 1,
                },
            },
            y: {
                label: "y/m",
                labelStyle: "math",
                ticks: {
                    step: undefined,
                    size: 4,
                    decimals: undefined,
                    unit: "m",
                    showUnit: false,
                    stroke: {
                        color: undefined,
                        width: 1,
                        pattern: "solid",
                        dashOffset: 0,
                        alpha: 1,
                    },
                },
                stroke: {
                    color: undefined,
                    width: 1.25,
                    pattern: "solid",
                    dashOffset: 0,
                    alpha: 1,
                },
            }
        };
    },

    /* World bounds may also react to display-only parameters. */
    world(_state, currentParameters) {
        const summary = calculateFlight(
            currentParameters.speed,
            currentParameters.angle,
            currentParameters.gravity,
        );

        const usesTime =
            currentParameters.coordinateSystem ===
            "time-height";

        return {
            xMin: 0,
            xMax: Math.max(
                usesTime ? 2 : 10,
                (usesTime
                    ? summary.flightTime
                    : summary.range) * 1.12,
            ),
            yMin: 0,
            yMax: Math.max(
                5,
                summary.maximumHeight * 1.3,
            ),

            /* Extra room is used for outward ticks and rich axis labels. */
            padding: 68,
        };
    },

    create(currentParameters) {
        const angle = degreesToRadians(
            currentParameters.angle,
        );

        return {
            time: 0,
            x: 0,
            y: 0,
            velocityX:
                currentParameters.speed *
                Math.cos(angle),
            velocityY:
                currentParameters.speed *
                Math.sin(angle),
            trajectory: [
                {
                    time: 0,
                    x: 0,
                    y: 0,
                },
            ],
        } satisfies ProjectileState;
    },

    update(
        state,
        currentParameters,
        deltaTime,
        elapsedTime,
        functions,
    ) {
        /* The runtime supplies fixed deltaTime and total elapsedTime. */
        state.time = elapsedTime;
        state.velocityY -=
            currentParameters.gravity *
            deltaTime;
        state.x +=
            state.velocityX * deltaTime;
        state.y +=
            state.velocityY * deltaTime;

        if (state.y < 0) {
            state.y = 0;
        }

        /* Functions are available in update as safely compiled evaluators. */
        void functions.height.evaluate(
            state.time,
        );

        const previousPoint =
            state.trajectory[
                state.trajectory.length - 1
            ];

        if (
            !previousPoint ||
            Math.hypot(
                state.x - previousPoint.x,
                state.y - previousPoint.y,
            ) > 0.2
        ) {
            state.trajectory.push({
                time: state.time,
                x: state.x,
                y: state.y,
            });
        }
    },

    draw({
        graphics,
        viewport,
        state,
        parameters: currentParameters,
        functions,
        elapsedTime,
    }) {
        graphics.clear(
            graphics.palette.background,
        );

        graphics.grid(viewport, {
            x: true,
            y: true,
            xStep: undefined,
            yStep: undefined,
            stroke: {
                color: graphics.palette.grid,
                width: 1,
                pattern: "dotted",
                dashOffset: 0,
                alpha: 1,
            },
            xStroke: {
                pattern: "dotted",
            },
            yStroke: {
                pattern: "dashed",
                alpha: 0.65,
            },
        });

        const usesTime =
            currentParameters.coordinateSystem ===
            "time-height";

        const toViewPoint = (
            point: TrajectoryPoint,
        ) => viewport.point(
            usesTime
                ? point.time
                : point.x,
            point.y,
        );

        if (currentParameters.showTrajectory) {
            graphics.polyline(
                state.trajectory.map(
                    toViewPoint,
                ),
                {
                    color:
                        graphics.palette.accent,
                    width: 2.25,
                    pattern: "dotted",
                    dashOffset: 0,
                    alpha: 0.95,
                },
            );
        }

        const flight = calculateFlight(
            currentParameters.speed,
            currentParameters.angle,
            currentParameters.gravity,
        );

        if (
            !functions.height.error
        ) {
            graphics.parametricGraph(
                viewport,
                (time) => ({
                    x: usesTime
                        ? time
                        : state.velocityX * time,
                    y:
                        functions.height.evaluate(
                            time,
                        ),
                }),
                {
                    domain: {
                        min: 0,
                        max: flight.flightTime,
                    },
                    samples: 480,
                    color: "secondary",
                    width: 2.25,
                    pattern: "dashed",
                    alpha: 0.9,
                },
            );
        }

        /* A dotted guide and a dashed ground line demonstrate stroke styles. */
        graphics.line(
            viewport.point(
                viewport.xMin,
                flight.maximumHeight,
            ),
            viewport.point(
                viewport.xMax,
                flight.maximumHeight,
            ),
            {
                color: graphics.palette.muted,
                width: 1,
                pattern: "dotted",
                alpha: 0.65,
            },
        );

        graphics.line(
            viewport.point(
                viewport.xMin,
                0,
            ),
            viewport.point(
                viewport.xMax,
                0,
            ),
            {
                color: graphics.palette.foreground,
                width: 1.5,
                pattern: "solid",
                alpha: 0.7,
            },
        );

        const position = viewport.point(
            usesTime
                ? state.time
                : state.x,
            state.y,
        );

        graphics.rectangle(
            viewport.x(0) - 7,
            viewport.y(0) - 5,
            14,
            5,
            {
                fill: graphics.palette.muted,
                stroke:
                    graphics.palette.foreground,
                strokeWidth: 1,
                strokePattern: "solid",
                strokeDashOffset: 0,
                alpha: 0.8,
            },
        );

        graphics.circle(position, 7, {
            fill: graphics.palette.accent,
            stroke:
                graphics.palette.foreground,
            strokeWidth: 1.5,
            strokePattern: "solid",
            strokeDashOffset: 0,
            alpha: 1,
        });

        if (currentParameters.showVelocity) {
            const velocityScale = 0.55;

            graphics.arrow(
                position,
                {
                    x:
                        position.x +
                        (usesTime
                            ? 1
                            : state.velocityX) *
                            velocityScale,
                    y:
                        position.y -
                        state.velocityY *
                            velocityScale,
                },
                {
                    color:
                        graphics.palette.accent,
                    width: 2,
                    pattern: "solid",
                    dashOffset: 0,
                    alpha: 1,
                    headSize: 7,
                },
            );
        }

        graphics.text({
            x: viewport.padding + 8,
            y: viewport.padding + 8,
            text:
                `t = ${elapsedTime.toFixed(2)} s`,
            color: graphics.palette.muted,
            size: 12,
            align: "left",
            baseline: "top",
            weight: 500,
            italic: false,
            rotation: 0,
        });

        graphics.richText({
            x:
                viewport.width -
                viewport.padding - 8,
            y: viewport.padding + 8,
            runs: [
                {
                    text: "v",
                    italic: true,
                    weight: 500,
                },
                {
                    text:
                        ` = ${Math.hypot(
                            state.velocityX,
                            state.velocityY,
                        ).toFixed(1)} m/s`,
                    italic: false,
                    weight: 500,
                },
            ],
            color: graphics.palette.muted,
            size: 12,
            align: "right",
            baseline: "top",
            weight: 500,
            rotation: 0,
        });
    },

    isComplete(
        state,
        _currentParameters,
        elapsedTime,
        functions,
    ) {
        void functions.height;

        return (
            elapsedTime > 0.05 &&
            state.y <= 0 &&
            state.velocityY < 0
        );
    },

    describe(
        state,
        currentParameters,
        elapsedTime,
        functions,
    ) {
        const enteredHeight =
            functions.height.evaluate(
                elapsedTime,
            );

        return (
            `At ${elapsedTime.toFixed(2)} seconds, the projectile is ` +
            `${state.x.toFixed(1)} metres horizontally and ` +
            `${state.y.toFixed(1)} metres high. ` +
            `The selected view is ${currentParameters.coordinateSystem}, ` +
            `and the entered function gives ${enteredHeight.toFixed(1)} metres.`
        );
    },
});

function calculateFlight(
    speed: number,
    angleDegrees: number,
    gravity: number,
) {
    const angle = degreesToRadians(
        angleDegrees,
    );
    const velocityX =
        speed * Math.cos(angle);
    const velocityY =
        speed * Math.sin(angle);
    const flightTime =
        2 * velocityY / gravity;
    const range =
        velocityX * flightTime;
    const maximumHeight =
        velocityY * velocityY /
        (2 * gravity);

    return {
        velocityX,
        velocityY,
        flightTime,
        range,
        maximumHeight,
    };
}

function degreesToRadians(
    degrees: number,
): number {
    return degrees * Math.PI / 180;
}
