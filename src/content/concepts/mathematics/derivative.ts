import type { Concept } from "../../models/Concept";

const force: Concept = {
    id: "derivative",
    title: "Derivative",

    aliases: [
        "derivatives",
    ],

    shortDefinition: String.raw`
A **derivative** is...
`,

    notation: String.raw`
\[
\frac{\mathrm{d}}{\mathrm{d}x}f(x)\quad\frac{\mathrm{df}}{\mathrm{d}x}\quad f'(x)\quad\dot f
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

    illustration: "/illustrations/TreTrinsReglen.svg",
};

export default force;