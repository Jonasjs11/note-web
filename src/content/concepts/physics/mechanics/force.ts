import {
    defineConcept,
} from "../../../models/Concept";

export default defineConcept({
    id: "force",

    translations: {
        en: {
            title: "Force",
            aliases: [
                "net force",
            ],
            shortDefinition:
                "An interaction that can change an object's motion.",
            notation: "$F$",
            formalDefinition:
                "Write the complete English definition here.",
        },

        da: {
            title: "Kraft",
            aliases: [
                "nettokraft",
            ],
            shortDefinition:
                "En vekselvirkning, der kan ændre et objekts bevægelse.",
            notation: "$F$",
            formalDefinition:
                "Skriv den fulde danske definition her.",
        },
    },

    illustration:
        "/illustrations/force.svg",

    /* Prerequisites also use permanent English IDs. */
    prerequisites: [
        "position",
    ],
});
