export interface ParsedTitle {
    title: string | null;
    error: string | null;
}

export function parseNoteTitle(
    source: string,
    filePath: string,
): ParsedTitle {
    const titleMatch = source.match(/^#\s+(.+?)\s*$/m);

    if (!titleMatch) {
        return {
            title: null,
            error:
                `Missing title in note "${filePath}". ` +
                'Every note must contain a level-one heading such as "# My Title".',
        };
    }

    return {
        title: titleMatch[1].trim(),
        error: null,
    };
}