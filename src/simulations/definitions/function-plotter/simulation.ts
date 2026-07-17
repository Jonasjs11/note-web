import {
    defineSimulation,
    functionInput,
    rangeParameter,
} from "../../runtime";

interface FunctionPlotterState {
    x: number;
}

const parameters = {
    speed: rangeParameter({
        label: "Point speed",
        initial: 2,
        min: 0.25,
        max: 8,
        step: 0.25,
        unit: "m/s",
    }),
};

const functionInputs = {
    curve: functionInput({
        label: "y(x)=",
        variable: "x",
        initial: "sin(x)",
        placeholder:
            "For example: sin(x), x^2 / 10, or 2x + 1",
        description:
            "Supported functions include sin, cos, tan, sqrt, abs, exp, ln, log, min, max, and pow.",
        color: "secondary",
        lineWidth: 2.5,
    }),
};

export default defineSimulation<
    typeof parameters,
    FunctionPlotterState,
    typeof functionInputs
>({
    id: "function-plotter",
    title: "Function plotter",
    description:
        "Enter a function and watch a point follow its graph.",

    parameters,
    functionInputs,

    axes: {
        y: {
            label: "y",
            unit: "m",
            ticks: {
                step: 2,
            },
        },
    },

    world: {
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
        padding: 58,
    },

    create() {
        return {
            x: -10,
        };
    },

    update(
        state,
        currentParameters,
        deltaTime,
    ) {
        state.x +=
            currentParameters.speed *
            deltaTime;
    },

    draw({
        graphics,
        viewport,
        state,
        functions,
    }) {
        graphics.clear();
        graphics.grid(viewport, {
            xStep: 0,
            yStep: 2,
        });

        const y =
            functions.curve.evaluate(
                state.x,
            );

        if (Number.isFinite(y)) {
            graphics.circle(
                viewport.point(
                    state.x,
                    y,
                ),
                7,
                {
                    fill:
                        graphics.palette.accent,
                    stroke:
                        graphics.palette.foreground,
                    strokeWidth: 1.5,
                },
            );
        }
    },

    isComplete(state) {
        return state.x >= 10;
    },
});
