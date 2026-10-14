import type { Diagnostic, DiagnosticResult } from "../models/Diagnostic";
import { getSourceLocation } from "../parser/getSourceLocation";

interface InlineFootnote {
    id: string;
    markdown: string;
}

/**
 * Convert LaTeX-style inline footnotes into ordinary GFM footnotes. Keeping
 * GFM responsible for the actual rendering means these share the existing
 * footnote hover preview, reference links and return arrows.
 *
 * Run this AFTER the other note transformations so commands inside the
 * footnote text (e.g. \\cite{key}) have already been transformed.
 */
export function transformFootnoteCommands(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];
    const footnotes: InlineFootnote[] = [];
    let result = "";
    let cursor = 0;
    let inFence: { marker: "`" | "~"; length: number } | undefined;
    let lineStart = true;
    let nextId = 1;

    while (cursor < source.length) {
        if (lineStart) {
            const end = source.indexOf("\n", cursor);
            const lineEnd = end < 0 ? source.length : end + 1;
            const line = source.slice(cursor, lineEnd);
            const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);

            if (inFence) {
                const close = new RegExp(
                    `^ {0,3}${inFence.marker === "`" ? "`" : "~"}{${inFence.length},}[ \\t]*(?:\\r?\\n)?$`,
                );
                if (close.test(line)) inFence = undefined;
                result += line;
                cursor = lineEnd;
                lineStart = true;
                continue;
            }
            if (fence) {
                inFence = {
                    marker: fence[1][0] as "`" | "~",
                    length: fence[1].length,
                };
                result += line;
                cursor = lineEnd;
                lineStart = true;
                continue;
            }
        }

        const character = source[cursor];
        if (character === "`") {
            const length = countRun(source, cursor, "`");
            const delimiter = "`".repeat(length);
            const closing = findCodeSpanEnd(source, cursor + length, delimiter);
            if (closing >= 0) {
                const after = closing + length;
                const original = source.slice(cursor, after);
                result += original;
                lineStart = original.endsWith("\n");
                cursor = after;
                continue;
            }
        }

        if (
            source.startsWith("\\footnote{", cursor) &&
            !isBackslashEscaped(source, cursor)
        ) {
            const bodyStart = cursor + "\\footnote{".length;
            const ending = findClosingBrace(source, bodyStart);
            if (ending < 0) {
                diagnostics.push({
                    severity: "error",
                    message: "Unclosed \\footnote{...} command.",
                    filePath,
                    location: getSourceLocation(source, cursor),
                });
                result += source.slice(cursor);
                break;
            }

            const text = source.slice(bodyStart, ending);
            if (!text.trim()) {
                diagnostics.push({
                    severity: "error",
                    message: "A \\footnote{...} must contain text.",
                    filePath,
                    location: getSourceLocation(source, cursor),
                });
                result += source.slice(cursor, ending + 1);
            } else {
                let id: string;
                // Do not collide with manually authored GFM labels.
                do {
                    id = `note-web-inline-${nextId++}`;
                } while (source.toLowerCase().includes(`[^${id}]`));
                footnotes.push({ id, markdown: text.trim() });
                result += `[^${id}]`;
            }
            cursor = ending + 1;
            lineStart = source[ending] === "\n";
            continue;
        }

        result += character;
        cursor += 1;
        lineStart = character === "\n";
    }

    if (footnotes.length === 0) return { value: result, diagnostics };

    // GFM definitions must appear on separate lines, outside prose paragraphs.
    // Four-space continuation indentation permits multiple lines/paragraphs.
    const definitions = footnotes.map(({ id, markdown }) => {
        const content = markdown.replace(/\r\n?/g, "\n").replace(/\n/g, "\n    ");
        return `[^${id}]: ${content}`;
    });
    return {
        value: `${result.trimEnd()}\n\n${definitions.join("\n\n")}\n`,
        diagnostics,
    };
}

function countRun(source: string, start: number, character: string): number {
    let index = start;
    while (source[index] === character) index++;
    return index - start;
}

/** A code span closes on a run of the *same* number of backticks. */
function findCodeSpanEnd(source: string, start: number, delimiter: string): number {
    let current = start;
    while (current < source.length) {
        const found = source.indexOf("`", current);
        if (found < 0) return -1;
        const length = countRun(source, found, "`");
        if (length === delimiter.length) return found;
        current = found + length;
    }
    return -1;
}

/** True if this backslash is itself escaped by an odd number of backslashes. */
function isBackslashEscaped(source: string, offset: number): boolean {
    let previous = offset - 1;
    while (previous >= 0 && source[previous] === "\\") previous--;
    return (offset - previous - 1) % 2 === 1;
}

function findClosingBrace(source: string, start: number): number {
    let depth = 1;
    for (let index = start; index < source.length; index++) {
        if (source[index] === "\\" && index + 1 < source.length) {
            index++; // Preserve escaped braces, e.g. \\{ and \\}.
            continue;
        }
        if (source[index] === "{") depth++;
        if (source[index] === "}") {
            depth--;
            if (depth === 0) return index;
        }
    }
    return -1;
}
