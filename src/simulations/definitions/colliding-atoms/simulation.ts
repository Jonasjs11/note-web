import {
    defineSimulation,
    FreeParticleSystem,
    rangeParameter,
} from "../../runtime";

const parameters = {
    temperature: rangeParameter({
        label: "Relative temperature",
        initial: 2,
        min: 0.2,
        max: 5,
        step: 0.1,
        resetOnChange: true,
    }),
};

interface State {
    system: FreeParticleSystem;
}

export default defineSimulation<
    typeof parameters,
    State
>({
    id: "colliding-atoms",
    title: "Colliding atoms",
    parameters,
    world: {
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 6,
    },
    create(currentParameters) {
        return {
            system: new FreeParticleSystem({
                capacity: 80,
                targetCount: 44,
                bounds: {
                    xMin: 0,
                    xMax: 10,
                    yMin: 0,
                    yMax: 6,
                },
                boundary: "bounce",
                collisions: {
                    restitution: 1,
                    iterations: 2,
                },
                initialize(particle, index) {
                    particle.radius = 0.11;
                    particle.mass = 1;
                    particle.x =
                        0.4 +
                        (index % 11) * 0.84;
                    particle.y =
                        0.5 +
                        Math.floor(index / 11) *
                            1.25;
                    const angle =
                        Math.random() *
                        Math.PI * 2;
                    particle.velocityX =
                        Math.cos(angle) *
                        currentParameters.temperature;
                    particle.velocityY =
                        Math.sin(angle) *
                        currentParameters.temperature;
                },
            }),
        };
    },
    update(state, _parameters, deltaTime) {
        state.system.update(deltaTime);
    },
    draw({ graphics, viewport, state }) {
        graphics.clear();

        state.system.forEachActive(
            (particle) => {
                graphics.circle(
                    viewport.point(
                        particle.x,
                        particle.y,
                    ),
                    Math.max(
                        3,
                        viewport.lengthX(
                            particle.radius,
                        ),
                    ),
                    {
                        fill:
                            graphics.palette.accent,
                        stroke:
                            graphics.palette.foreground,
                        strokeWidth: 1,
                    },
                );
            },
        );
    },
});
