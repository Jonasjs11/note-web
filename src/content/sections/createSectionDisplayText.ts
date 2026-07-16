/**
 * Produces a plain-text name suitable for references and navigation.
 * The authored Markdown remains available separately on Section.title.
 */
export function createSectionDisplayText(
    title: string,
): string {
    return title
        // Images and links keep their visible text.
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        // Note Web concepts keep their authored display text when present.
        .replace(
            /\\concept\{([^{}]*)\}(?:\[([^\]]*)\])?/g,
            (_match, id: string, alias: string | undefined) =>
                alias?.trim() || id.trim(),
        )
        // Keep the readable body of simple inline math.
        .replace(/\$([^$]+)\$/g, "$1")
        // Remove common Markdown decoration.
        .replace(/`([^`]*)`/g, "$1")
        .replace(/[*_~]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\\[a-zA-Z]+\{([^{}]*)\}/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}
