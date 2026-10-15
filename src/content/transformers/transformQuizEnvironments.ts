import { encodeCommandToken } from "../commands/CommandToken";
import type { Diagnostic, DiagnosticResult } from "../models/Diagnostic";
import { getSourceLocation } from "../parser/getSourceLocation";
import { parseQuizDefinition } from "../../quizzes/QuizDefinition";
import { transformMarkdownText } from "./transformMarkdownText";
import type { SourceTransformContext } from "./Transformer";

const quizPattern = /\\begin\{quiz\}(?:\[([^\]\n]*)\])?([\s\S]*?)\\end\{quiz\}/g;

/** Options may contain TeX, including escaped commas (\\,) and {braced groups}. */
export function parseQuizOptions(source: string): Record<string, string> {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < source.length; i++) {
        if (source[i] === "\\" && i + 1 < source.length) {
            i++;
        } else if (source[i] === "{") {
            depth++;
        } else if (source[i] === "}") {
            depth--;
            if (depth < 0) throw new Error("Unmatched } in quiz options.");
        } else if (source[i] === "," && depth === 0) {
            parts.push(source.slice(start, i));
            start = i + 1;
        }
    }
    if (depth !== 0) throw new Error("Unclosed { in quiz options.");
    parts.push(source.slice(start));
    const options: Record<string, string> = {};
    for (const part of parts) {
        if (!part.trim()) continue;
        const equals = part.indexOf("=");
        if (equals <= 0 || equals === part.length - 1) {
            throw new Error(`Invalid quiz option "${part.trim()}". Use key=value.`);
        }
        const name = part.slice(0, equals).trim().toLowerCase();
        const value = part.slice(equals + 1).trim();
        if (!(["type", "tolerance", "title", "unit"] as string[]).includes(name)) {
            throw new Error(`Unknown quiz option "${name}".`);
        }
        if (Object.hasOwn(options, name)) throw new Error(`Duplicate quiz option "${name}".`);
        if (!value) throw new Error(`Option ${name} cannot be empty.`);
        options[name] = value;
    }
    return options;
}

export function transformQuizEnvironments(
    source: string,
    filePath: string,
    _context: SourceTransformContext,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];
    // Only recognize the opening command in ordinary Markdown, not inside
    // an inline code span or a fenced code example. Once an opening command
    // is recognized, capture its WHOLE body from the original source. This
    // allows Markdown backticks *inside* a flashcard without splitting it.
    const validStarts = new Set<number>();
    transformMarkdownText(source, (text, sourceOffset) => {
        const opening = /\\begin\{quiz\}(?:\[([^\]\n]*)\])?/g;
        for (const match of text.matchAll(opening)) {
            validStarts.add(sourceOffset + match.index!);
        }
        return text;
    });
    const value = source.replace(quizPattern, (complete, optionSource: string | undefined,
        body: string, offset: number) => {
        if (!validStarts.has(offset)) return complete;
        try {
            const options = parseQuizOptions(optionSource ?? "");
            const type = options.type ?? "";
            const tolerance = Number(options.tolerance ?? "0.01");
            if (type === "flashcard" && (options.tolerance !== undefined || options.unit !== undefined)) {
                throw new Error("tolerance and unit only apply to type=math.");
            }
            if (options.title && options.title.length > 140) {
                throw new Error("Quiz title is too long (max. 140 characters).");
            }
            parseQuizDefinition(type, body, tolerance);
            const encoded = encodeCommandToken("quiz", [
                type, body.trim(), String(tolerance), options.title ?? "", options.unit ?? "",
            ]);
            // encodeURIComponent intentionally leaves punctuation such as *
            // unescaped. Escape it before Markdown parses an opaque token:
            // **bold** within a flashcard must not fragment the token.
            const markdownSafe = encoded.replace(/[!'()*._~-]/g, (character) =>
                `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
            );
            return "\n\n" + markdownSafe + "\n\n";
        } catch (error: unknown) {
            diagnostics.push({
                severity: "error",
                message: error instanceof Error ? `Invalid quiz: ${error.message}` : "Invalid quiz.",
                filePath,
                location: getSourceLocation(source, offset),
            });
            return complete;
        }
    });
    return { value, diagnostics };
}
