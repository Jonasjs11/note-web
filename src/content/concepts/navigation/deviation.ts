import {
    defineConcept,
} from "../../models/Concept";

import illustration
    from "../../assets/navigation/Deviation.png";

export default defineConcept({
    id: "deviation",

    translations: {
        en: {
            title: "Magnetic deviation",
            notation: String.raw`We will use $\mathrm{\mathbf{D}}$.`,
            aliases: [
            ],
            shortDefinition: "The compass error caused by local magnetic fields.",
        },

        da: {
            title: "Magnetisk deviation",
            notation: String.raw`Vi vil bruge $\mathrm{\mathbf{D}}$.`,
            aliases: [
            ],
            shortDefinition: "Kompas misvisningen forårsaget af lokale magnetiske felter.",
        },
    },

    illustration: illustration, // AI GENERATED: https://chatgpt.com/c/6a5b8ba5-3f40-83eb-bbe5-7a19d3240eb5

    prerequisites: [
        "angle",
        "magnetic field",
    ],
});
