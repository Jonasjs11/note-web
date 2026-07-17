import { defineConcept } from "../../../models/Concept";

export default defineConcept({
    id: "acceleration",

    translations: {
        en: {
            title: "Acceleration",
            aliases: [
                "accelerations",
            ],
            shortDefinition: "The amount the velocity (speed) of a body changes.",
            notation: String.raw`$\vec{a}$`,
            formalDefinition: String.raw`$\vec{a} = \frac{\mathrm{d}^2\vec{r}}{\mathrm{d}t^2}$`,
        },

        da: {
            title: "Acceleration",
            aliases: [
                "accelerationer",
            ],
            shortDefinition: "Mængden hastigheden (farten) af et legeme ændres.",
            notation: String.raw`$\vec{a}$`,
            formalDefinition: String.raw`$\vec{a} = \frac{\mathrm{d}^2\vec{r}}{\mathrm{d}t^2}$`,
        },
    },

    illustration: "../src/content/assets/physics/force.svg",

    prerequisites: [
        "derivative",
        "position",
        "velocity",
        "vector",
    ],
});