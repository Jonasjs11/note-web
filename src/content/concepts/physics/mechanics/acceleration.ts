import type { Concept } from "../../../models/Concept";

const force: Concept = {
    id: "acceleration",
    title: "Acceleration",

    aliases: [
        "accelerations",
    ],

    shortDefinition: String.raw`
A **acceleration** is...
`,

    notation: String.raw`
\[
\vec{a}
\]
`,

    formalDefinition: String.raw`
Newton's second law states that the net force acting on an object equals its mass multiplied by its acceleration.

\[
\vec{v} = \frac{\mathrm{d}^2\vec{r}}{\mathrm{d}t^2}
\]

The SI unit of force is the **newton**, written as $\mathrm{N}$.
`,

    prerequisites: [
        "derivative",
        "position",
        "velocity",
        "vector",
    ],

    illustration: "/illustrations/force.svg",
};

export default force;