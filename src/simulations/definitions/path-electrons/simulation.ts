import {
    createPolylineParticlePath,
    defineSimulation,
    PathParticleSystem,
    rangeParameter,
} from "../../runtime";

const parameters = {
    speed: rangeParameter({
        label: "Electron marker speed",
        initial: 2,
        min: -5,
        max: 5,
        step: 0.1,
        resetOnChange: false,
    }),
};

interface State {
    system: PathParticleSystem;
}

const path = createPolylineParticlePath(
    [
        { x: 1, y: 2 },
        { x: 9, y: 2 },
        { x: 9, y: 6 },
        { x: 1, y: 6 },
    ],
    {
        closed: true,
    },
);

export default defineSimulation<
    typeof parameters,
    State
>({
    id: "path-electrons",
    title: "Path-following electrons",
    parameters,
    world: {
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 8,
    },
    create(currentParameters) {
        const system =
            new PathParticleSystem({
                capacity: 40,
                path,
                loop: true,
                initialize(particle) {
                    particle.speed =
                        currentParameters.speed;
                    particle.radius = 3;
                },
            });

        system.seedEvenly(24);

        return { system };
    },
    update(
        state,
        currentParameters,
        deltaTime,
    ) {
        state.system.forEachActive(
            (particle) => {
                particle.speed =
                    currentParameters.speed;
            },
        );
        state.system.update(deltaTime);
    },
    draw({ graphics, viewport, state }) {
        graphics.clear();
        graphics.polyline(
            [
                { x: 1, y: 2 },
                { x: 9, y: 2 },
                { x: 9, y: 6 },
                { x: 1, y: 6 },
                { x: 1, y: 2 },
            ].map((point) =>
                viewport.point(
                    point.x,
                    point.y,
                ),
            ),
            {
                color: graphics.palette.muted,
                width: 5,
            },
        );

        state.system.forEachActive(
            (particle) => {
                graphics.circle(
                    viewport.point(
                        particle.sample.x,
                        particle.sample.y,
                    ),
                    particle.radius,
                    {
                        fill:
                            graphics.palette.accent,
                    },
                );
            },
        );
    },
});
