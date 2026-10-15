import type { ContentLanguage } from "./contentLanguage";

/** Optional, backwards-compatible translations in simulation definitions. */
export interface LocalizedDefinitionText {
    labelTranslations?: Partial<Record<ContentLanguage, string>>;
    descriptionTranslations?: Partial<Record<ContentLanguage, string>>;
}
export function localizedDefinitionLabel<T extends { label: string }>(
    definition: T,
    language: ContentLanguage,
): string {
    const candidate = definition as T & LocalizedDefinitionText;
    return candidate.labelTranslations?.[language] ?? definition.label;
}
