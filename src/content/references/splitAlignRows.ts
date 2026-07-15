export interface AlignRowInfo {
    source: string;
    startOffset: number;
    endOffset: number;
}

/**
 * Splits the contents of an align environment into numbered rows.
 *
 * Offsets are relative to the beginning of the align environment's
 * content, not the complete note.
 */
export function splitAlignRows(
    content: string,
): AlignRowInfo[] {
    const rows: AlignRowInfo[] = [];

    let rowStart = 0;
    let braceDepth = 0;
    let index = 0;

    while (index < content.length) {
        const character = content[index];
        const previousCharacter =
            index > 0
                ? content[index - 1]
                : undefined;

        if (
            character === "{" &&
            previousCharacter !== "\\"
        ) {
            braceDepth++;
            index++;
            continue;
        }

        if (
            character === "}" &&
            previousCharacter !== "\\" &&
            braceDepth > 0
        ) {
            braceDepth--;
            index++;
            continue;
        }

        const isRowSeparator =
            braceDepth === 0 &&
            character === "\\" &&
            content[index + 1] === "\\";

        if (!isRowSeparator) {
            index++;
            continue;
        }

        addRow(
            rows,
            content,
            rowStart,
            index,
        );

        index += 2;

        index = skipOptionalSpacingArgument(
            content,
            index,
        );

        rowStart = index;
    }

    addRow(
        rows,
        content,
        rowStart,
        content.length,
    );

    return rows;
}

function addRow(
    rows: AlignRowInfo[],
    content: string,
    rawStartOffset: number,
    rawEndOffset: number,
): void {
    const trimmedRange = trimRange(
        content,
        rawStartOffset,
        rawEndOffset,
    );

    if (
        trimmedRange.startOffset ===
        trimmedRange.endOffset
    ) {
        return;
    }

    rows.push({
        source: content.slice(
            trimmedRange.startOffset,
            trimmedRange.endOffset,
        ),
        startOffset:
            trimmedRange.startOffset,
        endOffset:
            trimmedRange.endOffset,
    });
}

function trimRange(
    content: string,
    startOffset: number,
    endOffset: number,
): {
    startOffset: number;
    endOffset: number;
} {
    let trimmedStart = startOffset;
    let trimmedEnd = endOffset;

    while (
        trimmedStart < trimmedEnd &&
        isWhitespace(content[trimmedStart])
    ) {
        trimmedStart++;
    }

    while (
        trimmedEnd > trimmedStart &&
        isWhitespace(
            content[trimmedEnd - 1],
        )
    ) {
        trimmedEnd--;
    }

    return {
        startOffset: trimmedStart,
        endOffset: trimmedEnd,
    };
}

function isWhitespace(
    character: string,
): boolean {
    return (
        character === " " ||
        character === "\t" ||
        character === "\n" ||
        character === "\r"
    );
}

function skipOptionalSpacingArgument(
    content: string,
    startIndex: number,
): number {
    let index = startIndex;

    while (
        content[index] === " " ||
        content[index] === "\t"
    ) {
        index++;
    }

    if (content[index] !== "[") {
        return index;
    }

    const closingBracket =
        content.indexOf("]", index + 1);

    if (closingBracket === -1) {
        return index;
    }

    return closingBracket + 1;
}