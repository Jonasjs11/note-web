import type { Note } from "../models/Note";

const noteFiles = import.meta.glob(
    "../notes/**/*.mdx",
    {
        eager: true,
        query: "?raw",
        import: "default",
    },
) as Record<string, string>;

export const notes: Note[] = Object.entries(noteFiles)
    .map(([filePath, source]) => createNote(filePath, source))
    .sort((first, second) => {
        return first.url.localeCompare(second.url);
    });

function createNote(
    filePath: string,
    source: string,
): Note {
    const relativePath = filePath
        .replace("../notes/", "")
        .replace(/\.mdx$/, "");

    const segments = relativePath.split("/");

    if (segments.length < 2) {
        throw new Error(
            `Invalid note path: "${filePath}". ` +
            "A note must be inside a subject folder.",
        );
    }

    const subject = segments[0];
    const id = segments.at(-1);

    if (!id) {
        throw new Error(
            `Could not determine note ID from "${filePath}".`,
        );
    }

    const folders = segments.slice(1, -1);

    return {
        id,
        title: formatTitle(id),

        subject,
        folders,

        url: `/${segments.join("/")}`,
        filePath,
        source,
    };
}

function formatTitle(value: string): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}