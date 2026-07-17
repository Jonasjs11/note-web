export const CONTENT_LANGUAGES = [
    "en",
    "da",
] as const;

export type ContentLanguage =
    (typeof CONTENT_LANGUAGES)[number];

export const DEFAULT_CONTENT_LANGUAGE:
    ContentLanguage = "en";

export function isContentLanguage(
    value: unknown,
): value is ContentLanguage {
    return (
        typeof value === "string" &&
        CONTENT_LANGUAGES.includes(
            value as ContentLanguage,
        )
    );
}
