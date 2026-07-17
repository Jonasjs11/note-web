import {
    defineConcept,
} from "../../../models/Concept";

export default defineConcept({
    id: "lift",

    translations: {
        en: {
            title: "Lift",
            notation: String.raw`$\vec{F}_\mathrm{L}$.`,
            aliases: [
            ],
            shortDefinition: "The component of the net aerodynamic forces, which is perpendicular to the relative wind.",
        },

        da: {
            title: "Opdrift",
            notation: String.raw`$\vec{F}_\mathrm{L}$.`,
            aliases: [
            ],
            shortDefinition: "Komposanten af den resulterende aerodynamiske kraft, som er vinkelret på den relative vind.",
        },
    },

    illustration: "../src/content/assets/aerodynamik/VingeprofilFLFD.svg",

    prerequisites: [
        "force",
    ],
});
