import type { Concept } from "../../../models/Concept";

const force: Concept = {
    id: "position",
    title: "Position",

    aliases: [
        "positions",
    ],

    shortDefinition: String.raw`
A **position** is...
`,

    notation: String.raw`
\[
\vec{r}
\]
`,

    formalDefinition: String.raw`
Newton's second law states that the net force acting on an object equals its mass multiplied by its acceleration.

\[
\vec{F}_{\mathrm{net}} = m\vec{a}
\]

The SI unit of force is the **newton**, written as $\mathrm{N}$.
`,

    prerequisites: [
        "vector",
    ],

    illustration: "/illustrations/force.svg",
};

export default force;