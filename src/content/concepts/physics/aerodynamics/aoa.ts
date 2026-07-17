import {
    defineConcept,
} from "../../../models/Concept";

import illustration
    from "../../../assets/aerodynamik/VingeprofilBegreber.svg";

export default defineConcept({
    id: "aoa",

    translations: {
        en: {
            title: "Angle of attack",
            notation: String.raw`Usually denoted with $\alpha$.`,
            aliases: [
            ],
            shortDefinition: "The angle between the chord and the relative wind.",
        },

        da: {
            title: "Indfaldsvinkel",
            notation: String.raw`Ofte betegnet med $\alpha$.`,
            aliases: [
            ],
            shortDefinition: "Vinklen mellem korden og den relative vind.",
        },
    },

    illustration: illustration,

    prerequisites: [
        "angle",
        "chord",
    ],
});
