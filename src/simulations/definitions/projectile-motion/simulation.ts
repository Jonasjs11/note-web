import {
    booleanParameter,
    defineSimulation,
    rangeParameter,
} from "../../runtime";

interface ProjectileState {
    time: number;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    trajectory: {
        x: number;
        y: number;
    }[];
}

const parameters = {
    speed: rangeParameter({
        label: "Initial speed",
        initial: 20,
        min: 1,
        max: 40,
        step: 1,
        unit: "m/s",
    }),

    angle: rangeParameter({
        label: "Launch angle",
        initial: 45,
        min: 5,
        max: 85,
        step: 1,
        unit: "°",
    }),

    gravity: rangeParameter({
        label: "Gravity",
        initial: 9.81,
        min: 1,
        max: 20,
        step: 0.1,
        unit: "m/s²",
    }),

    showVelocity: booleanParameter({
        label: "Show velocity vector",
        initial: true,
    }),
};

export default defineSimulation<typeof parameters, ProjectileState>({
    id: "projectile-motion",
    title: "Projectile motion",
    description:
        "Change the launch conditions and inspect the resulting trajectory.",

    aspectRatio: 16 / 9,
    fixedTimeStep: 1 / 120,

    parameters,

    world(_state, currentParameters) {
        const angle = degreesToRadians(
            currentParameters.angle,
        );

        const flightTime =
            2 *
            currentParameters.speed *
            Math.sin(angle) /
            currentParameters.gravity;

        const range =
            currentParameters.speed *
            Math.cos(angle) *
            flightTime;

        const maximumHeight =
            Math.pow(
                currentParameters.speed *
                    Math.sin(angle),
                2,
            ) /
            (2 * currentParameters.gravity);

        return {
            xMin: 0,
            xMax: Math.max(10, range * 1.12),
            yMin: 0,
            yMax: Math.max(
                5,
                maximumHeight * 1.3,
            ),
            padding: 38,
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
    ) {
        state.time += deltaTime;

        state.velocityY -=
            currentParameters.gravity *
            deltaTime;

        state.x +=
            state.velocityX *
            deltaTime;

        state.y +=
            state.velocityY *
            deltaTime;

        if (state.y < 0) {
            state.y = 0;
        }

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
    }) {
        graphics.clear();
        graphics.grid(viewport);
        graphics.axes(viewport, {
            xLabel: "Distance (m)",
            yLabel: "Height (m)",
        });

        graphics.polyline(
            state.trajectory.map(
                (point) =>
                    viewport.point(
                        point.x,
                        point.y,
                    ),
            ),
            {
                color:
                    graphics.palette.secondary,
                width: 2,
            },
        );

        const position = viewport.point(
            state.x,
            state.y,
        );

        graphics.circle(
            position,
            7,
            {
                fill:
                    graphics.palette.accent,
                stroke:
                    graphics.palette.foreground,
                strokeWidth: 1.5,
            },
        );

        if (currentParameters.showVelocity) {
            const velocityScale = 0.55;

            graphics.arrow(
                position,
                {
                    x:
                        position.x +
                        state.velocityX *
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
                    headSize: 7,
                },
            );
        }
    },

    isComplete(state) {
        return (
            state.time > 0.05 &&
            state.y <= 0 &&
            state.velocityY < 0
        );
    },

    describe(state) {
        return (
            `Projectile at ${state.x.toFixed(1)} metres horizontally ` +
            `and ${state.y.toFixed(1)} metres high.`
        );
    },
});

function degreesToRadians(
    degrees: number,
): number {
    return degrees * Math.PI / 180;
}
