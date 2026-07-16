/**
 * Creates the predictable portion of an automatic section label.
 *
 * Example:
 *   "Newton's laws" -> "newtons-laws"
 */
export function createSectionSlug(
    title: string,
): string {
    const normalized = title
        .replaceAll("Æ", "Ae")
        .replaceAll("Ø", "O")
        .replaceAll("Å", "A")
        .replaceAll("æ", "ae")
        .replaceAll("ø", "o")
        .replaceAll("å", "a")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized || "section";
}
