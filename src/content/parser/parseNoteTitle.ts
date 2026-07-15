import type {
    Diagnostic,
    DiagnosticResult,
} from "../models/Diagnostic";

import { getSourceLocation } from "./getSourceLocation";

export interface ParsedNoteTitle {
    title: string | null;
}

export function parseNoteTitle(
    source: string,
    filePath: string,
): DiagnosticResult<ParsedNoteTitle> {
    const diagnostics: Diagnostic[] = [];

    const headingPattern = /^#(?:[ \t]+)(.*)$/gm; //Regex that find the title after the singular #
    const titleMatches = [...source.matchAll(headingPattern)];

    if (titleMatches.length === 0) {
        diagnostics.push({
            severity: "error",
            message:
                'Missing note title. Add a level-one heading such as "# My Title".',
            filePath,
            location: {
                line: 1,
                column: 1,
            },
        });

        return {
            value: {
                title: null,
            },
            diagnostics,
        };
    }

    const firstMatch = titleMatches[0];
    const title = firstMatch[1].trim();

    if (title.length === 0) {
        diagnostics.push({
            severity: "error",
            message: "The note title cannot be empty.",
            filePath,
            location: getSourceLocation(
                source,
                firstMatch.index,
            ),
        });
    }

    if (titleMatches.length > 1) {
        for (const extraMatch of titleMatches.slice(1)) {
            diagnostics.push({
                severity: "warning",
                message:
                    "This note contains another level-one heading. " +
                    "Use level-two headings for sections.",
                filePath,
                location: getSourceLocation(
                    source,
                    extraMatch.index,
                ),
            });
        }
    }

    return {
        value: {
            title: title.length > 0 ? title : null,
        },
        diagnostics,
    };
}