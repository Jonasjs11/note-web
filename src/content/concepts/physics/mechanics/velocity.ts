import type { Concept } from "../../../models/Concept";

const force: Concept = {
    id: "velocity",
    title: "Velocity",

    aliases: [
        "velocities",
    ],

    shortDefinition: String.raw`
A **velocity** is...
`,

    notation: String.raw`
\[
\vec{v}
\]
`,

    formalDefinition: String.raw`
Newton's second law states that the net force acting on an object equals its mass multiplied by its acceleration.

\[
\vec{v} = \frac{\mathrm{d}\vec{r}}{\mathrm{d}t}
\]

The SI unit of force is the **newton**, written as $\mathrm{N}$.
`,

    prerequisites: [
        "derivative",
        "position",
        "vector",
    ],

    illustration: "/illustrations/force.svg",
};

export default force;