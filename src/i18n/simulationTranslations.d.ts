import type { ContentLanguage } from "./contentLanguage";

declare module "../simulations/runtime/simulationTypes" {
    interface SimulationParameterBehaviour {
        /** Optional UI labels; existing `label` remains the fallback. */
        labelTranslations?: Partial<Record<ContentLanguage, string>>;
        descriptionTranslations?: Partial<Record<ContentLanguage, string>>;
    }
    interface SelectParameterOption {
        labelTranslations?: Partial<Record<ContentLanguage, string>>;
    }
}
export {};
