import type { Concept } from "../../models/Concept";

import illustration
    from "../../assets/physics/force.svg";

const force: Concept = {
    id: "vector",
    title: "Vector",

    aliases: [
        "vectors",
    ],

    shortDefinition: String.raw`
A **vector** is...
`,

    notation: String.raw`
\[
\vec{v}\quad\mathbf{v}
\]
`,

    formalDefinition: String.raw`
Newton's second law states that the net force acting on an object equals its mass multiplied bf its acceleration.

\[
\frac{\mathrm{d}}{\mathrm{d}x}f(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}
\]
`,

    prerequisites: [

    ],

    illustration: illustration,
};

export default force;