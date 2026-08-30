import {
    defineConcept,
} from "../../models/Concept";

import illustration
    from "../../assets/navigation/MagneticDeclination.png";

export default defineConcept({
    id: "declination",

    translations: {
        en: {
            title: "Magnetic declination (sometimes magnetic variation)",
            notation: String.raw`Sometimes denoted with $\delta$, but we will use $\mathrm{\mathbf{V}}$ because of the danish name "variation".`,
            aliases: [
            ],
            shortDefinition: "The angle between magnetic north and true north at a particular location. The angle is by convention positive when magnetic north is east of true north, and negative when it is to the west.",
        },

        da: {
            title: "Magnetisk variation",
            notation: String.raw`Nogle gange betegnet med $\delta$, men vi vil bruge $\mathrm{\mathbf{V}}$.`,
            aliases: [
            ],
            shortDefinition: "Vinklen mellem magnetisk nord og sand nord ved et bestemt sted. Vinklen er efter konvention positiv, når magnetisk nord er øst for den sande nord, og negavitv, når den er vest for.",
        },
    },

    illustration: illustration, // https://nora.nerc.ac.uk/id/eprint/510709/1/WMM2015_Report.pdf

    prerequisites: [
        "angle",
        "true north",
        "magnetic north"
    ],
});
