import { defineConcept } from "../../../models/Concept";

export default defineConcept({
    id: "position",

    translations: {
        en: {
            title: "Position",
            aliases: [
                "positions",
            ],
            shortDefinition: "An interaction that can change an object's motion.",
            notation: String.raw`$\vec{r}$`,
            formalDefinition: "Write the complete English definition here.",
        },

        da: {
            title: "Position",
            aliases: [
                "positioner",
            ],
            shortDefinition: "En vekselvirkning, der kan ændre et objekts bevægelse.",
            notation: String.raw`$\vec{r}$`,
            formalDefinition: "Skriv den fulde danske definition her.",
        },
    },

    illustration: "../src/content/assets/physics/force.svg",


    prerequisites: [
        "vector",
    ],
});