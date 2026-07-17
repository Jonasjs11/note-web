import { defineConcept } from "../../../models/Concept";

export default defineConcept({
    id: "force",

    translations: {
        en: {
            title: "Force",
            aliases: [
                "net force",
            ],
            shortDefinition: "An interaction that can change an object's motion.",
            notation: String.raw`$\vec{F}$`,
            formalDefinition: "Write the complete English definition here.",
        },

        da: {
            title: "Kraft",
            aliases: [
                "nettokraft",
                "resulterede-kraft"
            ],
            shortDefinition: "En vekselvirkning, der kan ændre et objekts bevægelse.",
            notation: String.raw`$\vec{F}$`,
            formalDefinition: "Skriv den fulde danske definition her.",
        },
    },

    illustration: "../src/content/assets/physics/force.svg",

    prerequisites: [
    ],
});