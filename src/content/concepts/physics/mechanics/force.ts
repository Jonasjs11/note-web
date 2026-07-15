import type { Concept } from "../../../models/Concept";

const force: Concept = {
    id: "force",
    title: "Force",

    aliases: [
        "forces",
        "net force",
    ],

    shortDefinition: String.raw`
A **force** is an interaction that can change an object's motion.
`,

    notation: String.raw`
\[
\vec{F}
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
        "mass",
        "acceleration",
        "vector",
    ],

    illustration: "/illustrations/force.svg",
};

export default force;