import {
    defineConcept,
} from "../../../models/Concept";

export default defineConcept({
    id: "chord",

    translations: {
        en: {
            title: "Chord",
            aliases: [
            ],
            shortDefinition:
                "The line/distance from the leading edge to the trailing edge.",
        },

        da: {
            title: "Korde",
            aliases: [
                "Profilkorde",
            ],
            shortDefinition:
                "Linjen/distancen fra forkanten til bagkanten.",
        },
    },

    illustration: "../src/content/assets/aerodynamik/VingeprofilBegreber.svg",

    prerequisites: [
    ],
});
