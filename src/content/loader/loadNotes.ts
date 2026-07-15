import type { Note } from "../models/Note";
import { parseNoteTitle } from "../parser/parseNoteTitle";
import { transformSource } from "../transformers/transformSource";

import { analyzeEquationTargets } from "../references/analyzeEquationTargets";

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

    const titleResult = parseNoteTitle(source, filePath);

    const referenceAnalysis = analyzeEquationTargets(source, filePath);

    const transformationResult =
    transformSource(
        source,
        filePath,
        referenceAnalysis.targets,
        referenceAnalysis.numberedEquations,
    );

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
        title:
            titleResult.value.title ??
            `⚠ ${formatFallbackTitle(id)}`,

        subject,
        folders,

        url: `/${segments.join("/")}`,
        filePath,

        source,
        transformedSource: transformationResult.value,

        references: referenceAnalysis.targets,
        diagnostics: [
            ...titleResult.diagnostics,
            ...referenceAnalysis.diagnostics,
            ...transformationResult.diagnostics,
        ],
    };
}

function formatFallbackTitle(
    value: string,
): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}