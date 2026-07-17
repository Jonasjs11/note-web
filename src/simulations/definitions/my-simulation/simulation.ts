import {
    defineSimulation,
    rangeParameter,
} from "../../runtime";

interface MySimulationState {
    time: number;
    position: number;
}

const parameters = {
    speed: rangeParameter({
        label: "Speed",
        initial: 1,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "m/s",
    }),
};

export default defineSimulation<
    typeof parameters,
    MySimulationState
>({
    id: "my-simulation",

    title: "My Simulation",

    description:
        "A simple object moving at constant speed.",

    parameters,

    world: {
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 10,
        padding: 32,
    },

    create() {
        return {
            time: 0,
            position: 0,
        };
    },

    update(
        state,
        currentParameters,
        deltaTime,
    ) {
        state.time += deltaTime;

        state.position +=
            currentParameters.speed *
            deltaTime;

        /*
         * Return to the beginning when the object
         * reaches the right side.
         */
        if (state.position > 10) {
            state.position = 0;
        }
    },

    draw({
        graphics,
        viewport,
        state,
    }) {
        graphics.clear();

        graphics.grid(viewport);
        graphics.axes(viewport);

        graphics.circle(
            viewport.point(
                state.position,
                5,
            ),
            7,
        );
    },
});