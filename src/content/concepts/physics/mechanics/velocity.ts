import { defineConcept } from "../../../models/Concept";

export default defineConcept({
    id: "velocity",

    translations: {
        en: {
            title: "Velocity",
            aliases: [
                "velocities",
            ],
            shortDefinition: "The amount the position of a body changes.",
            notation: String.raw`$\vec{v}$`,
            formalDefinition: String.raw`$\vec{a} = \frac{\mathrm{d}\vec{r}}{\mathrm{d}t}$`,
        },

        da: {
            title: "Hastighed",
            aliases: [
                "hastigheder",
            ],
            shortDefinition: "Mængden positionen af et legeme ændres.",
            notation: String.raw`$\vec{v}$`,
            formalDefinition: String.raw`$\vec{v} = \frac{\mathrm{d}\vec{r}}{\mathrm{d}t}$`,
        },
    },

    illustration: "../src/content/assets/physics/force.svg",

    prerequisites: [
        "derivative",
        "position",
        "vector",
    ],
});