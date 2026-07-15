import type { SourceLocation } from "../models/Diagnostic";

export function getSourceLocation(
    source: string,
    index: number,
): SourceLocation {
    const contentBeforeIndex = source.slice(0, index);
    const lines = contentBeforeIndex.split("\n");

    return {
        line: lines.length,
        column: lines.at(-1)!.length + 1,
    };
}