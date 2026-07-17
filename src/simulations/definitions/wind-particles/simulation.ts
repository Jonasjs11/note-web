import {
    defineSimulation,
    FreeParticleSystem,
    rangeParameter,
} from "../../runtime";

const parameters = {
    speed: rangeParameter({
        label: "Mean wind speed",
        initial: 3,
        min: 0,
        max: 8,
        step: 0.1,
        resetOnChange: false,
    }),
};

interface State {
    system: FreeParticleSystem;
}

export default defineSimulation<
    typeof parameters,
    State
>({
    id: "wind-particles",
    title: "Wind particles",
    parameters,
    world: {
        xMin: 0,
        xMax: 12,
        yMin: 0,
        yMax: 7,
    },
    create(currentParameters) {
        return {
            system: new FreeParticleSystem({
                capacity: 100,
                targetCount: 70,
                bounds: {
                    xMin: 0,
                    xMax: 12,
                    yMin: 0,
                    yMax: 7,
                },
                boundary: "recycle",
                collisions: false,
                initialize(particle) {
                    particle.x =
                        Math.random() * 12;
                    particle.y =
                        Math.random() * 7;
                    particle.velocityX =
                        currentParameters.speed *
                        (0.8 + Math.random() * 0.4);
                    particle.velocityY =
                        (Math.random() - 0.5) * 0.3;
                    particle.radius =
                        0.02 + Math.random() * 0.04;
                    particle.alpha =
                        0.35 + Math.random() * 0.45;
                },
            }),
        };
    },
    update(
        state,
        currentParameters,
        deltaTime,
    ) {
        state.system.forEachActive(
            (particle) => {
                particle.velocityX =
                    Math.max(
                        0.05,
                        currentParameters.speed,
                    );
            },
        );
        state.system.update(deltaTime);
    },
    draw({ graphics, viewport, state }) {
        graphics.clear();

        state.system.forEachActive(
            (particle) => {
                const from = viewport.point(
                    particle.x,
                    particle.y,
                );

                graphics.line(
                    from,
                    {
                        x: from.x + 12,
                        y: from.y,
                    },
                    {
                        color:
                            graphics.palette.secondary,
                        width: 1.2,
                        alpha: particle.alpha,
                    },
                );
            },
        );
    },
});
