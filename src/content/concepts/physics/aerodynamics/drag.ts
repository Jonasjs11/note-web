import {
    defineConcept,
} from "../../../models/Concept";

import illustration
    from "../../../assets/aerodynamik/VingeprofilFLFD.svg";

export default defineConcept({
    id: "drag",

    translations: {
        en: {
            title: "Drag",
            notation: String.raw`$\vec{F}_\mathrm{D}$.`,
            aliases: [
            ],
            shortDefinition: "The component of the net aerodynamic forces, which is parallel to the relative wind.",
        },

        da: {
            title: "Modstand",
            notation: String.raw`$\vec{F}_\mathrm{D}$.`,
            aliases: [
            ],
            shortDefinition: "Komposanten af den resulterende aerodynamiske kraft, som er parallel med den relative vind.",
        },
    },

    illustration: illustration,

    prerequisites: [
        "force",
    ],
});
