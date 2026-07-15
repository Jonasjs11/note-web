/**
 * Splits the contents of an align environment into numbered rows.
 *
 * It splits at top-level LaTeX line breaks:
 *
 *     \\
 *
 * Line breaks inside brace groups are ignored.
 *
 * Empty rows are removed.
 */
export function splitAlignRows(
    content: string,
): string[] {
    const rows: string[] = [];

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
            content.slice(
                rowStart,
                index,
            ),
        );

        index += 2;

        /*
         * An align row break may have an optional
         * vertical-spacing argument:
         *
         *     \\[0.5rem]
         *
         * It belongs to the separator, not the next row.
         */
        index = skipOptionalSpacingArgument(
            content,
            index,
        );

        rowStart = index;
    }

    addRow(
        rows,
        content.slice(rowStart),
    );

    return rows;
}

function addRow(
    rows: string[],
    rawRow: string,
): void {
    const row = rawRow.trim();

    if (row.length > 0) {
        rows.push(row);
    }
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