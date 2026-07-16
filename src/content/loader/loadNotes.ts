import type { Note } from "../models/Note";
import { parseNoteTitle } from "../parser/parseNoteTitle";
import { transformSource } from "../transformers/transformSource";

import { analyzeEquationTargets } from "../references/analyzeEquationTargets";

import {
    analyzeFigureTargets,
} from "../references/analyzeFigureTargets";

import { analyzeTableTargets } from "../references/analyzeTableTargets";

import { analyzeSectionTargets } from "../references/analyzeSectionTargets";


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

    const equationAnalysis = analyzeEquationTargets(source, filePath);

    const figureAnalysis = analyzeFigureTargets(
        source,
        filePath,
        equationAnalysis.targets,
    );

    const tableAnalysis = analyzeTableTargets(
        source,
        filePath,
        [
            ...equationAnalysis.targets,
            ...figureAnalysis.targets,
        ],
    );

    const sectionAnalysis = analyzeSectionTargets(
        source,
        filePath,
        [
            ...equationAnalysis.targets,
            ...figureAnalysis.targets,
            ...tableAnalysis.targets,
        ],
    );



    const referenceTargets = [
        ...equationAnalysis.targets,
        ...figureAnalysis.targets,
        ...tableAnalysis.targets,
        ...sectionAnalysis.targets,
    ];

    const transformationResult = transformSource(
        source,
        filePath,
        referenceTargets,
        equationAnalysis.numberedEquations,
        figureAnalysis.numberedFigures,
        tableAnalysis.numberedTables,
        sectionAnalysis.sections,
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

        references: referenceTargets,

        numberedFigures: figureAnalysis.numberedFigures,
        sections: sectionAnalysis.sections,
        diagnostics: [
            ...titleResult.diagnostics,
            ...equationAnalysis.diagnostics,
            ...figureAnalysis.diagnostics,
            ...tableAnalysis.diagnostics,
            ...sectionAnalysis.diagnostics,
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