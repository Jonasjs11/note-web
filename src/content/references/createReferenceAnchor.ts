export function createReferenceAnchor(
    label: string,
): string {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}