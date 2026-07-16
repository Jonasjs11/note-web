export interface MarkdownTableBlock {
    source: string;
    startOffset: number;
    endOffset: number;
}

interface SourceLine {
    text: string;
    startOffset: number;
    endOffset: number;
}

export function findMarkdownTables(
    source: string,
): MarkdownTableBlock[] {
    const lines = splitSourceLines(source);
    const tables: MarkdownTableBlock[] = [];

    for (
        let lineIndex = 0;
        lineIndex + 1 < lines.length;
        lineIndex++
    ) {
        const header = lines[lineIndex];
        const delimiter = lines[lineIndex + 1];

        if (
            !isPotentialTableRow(header.text) ||
            !isDelimiterRow(delimiter.text)
        ) {
            continue;
        }

        let endLineIndex = lineIndex + 2;

        while (
            endLineIndex < lines.length &&
            isPotentialTableRow(
                lines[endLineIndex].text,
            )
        ) {
            endLineIndex++;
        }

        const startOffset =
            header.startOffset;

        const endOffset =
            lines[endLineIndex - 1].endOffset;

        tables.push({
            source: source
                .slice(
                    startOffset,
                    endOffset,
                )
                .trimEnd(),
            startOffset,
            endOffset,
        });

        lineIndex = endLineIndex - 1;
    }

    return tables;
}

function splitSourceLines(
    source: string,
): SourceLine[] {
    const lines: SourceLine[] = [];
    let startOffset = 0;

    while (startOffset < source.length) {
        const newlineOffset =
            source.indexOf("\n", startOffset);

        const lineEnd = newlineOffset === -1
            ? source.length
            : newlineOffset;

        const textEnd =
            lineEnd > startOffset &&
            source[lineEnd - 1] === "\r"
                ? lineEnd - 1
                : lineEnd;

        lines.push({
            text: source.slice(
                startOffset,
                textEnd,
            ),
            startOffset,
            endOffset:
                newlineOffset === -1
                    ? source.length
                    : newlineOffset + 1,
        });

        if (newlineOffset === -1) {
            break;
        }

        startOffset = newlineOffset + 1;
    }

    return lines;
}

function isPotentialTableRow(
    line: string,
): boolean {
    const trimmed = line.trim();

    if (!trimmed) {
        return false;
    }

    /*
     * Metadata commands terminate the Markdown table even when
     * transformed command tokens inside them contain pipe symbols.
     */
    if (trimmed.startsWith("\\")) {
        return false;
    }

    return hasUnescapedPipe(trimmed);
}

function isDelimiterRow(
    line: string,
): boolean {
    const cells = splitTableCells(line);

    return (
        cells.length >= 2 &&
        cells.every((cell) =>
            /^:?-{3,}:?$/.test(
                cell.trim(),
            ),
        )
    );
}

function splitTableCells(
    line: string,
): string[] {
    let content = line.trim();

    if (content.startsWith("|")) {
        content = content.slice(1);
    }

    if (
        content.endsWith("|") &&
        !isEscaped(content, content.length - 1)
    ) {
        content = content.slice(0, -1);
    }

    const cells: string[] = [];
    let cellStart = 0;

    for (
        let index = 0;
        index < content.length;
        index++
    ) {
        if (
            content[index] !== "|" ||
            isEscaped(content, index)
        ) {
            continue;
        }

        cells.push(
            content.slice(cellStart, index),
        );
        cellStart = index + 1;
    }

    cells.push(content.slice(cellStart));

    return cells;
}

function hasUnescapedPipe(
    value: string,
): boolean {
    for (
        let index = 0;
        index < value.length;
        index++
    ) {
        if (
            value[index] === "|" &&
            !isEscaped(value, index)
        ) {
            return true;
        }
    }

    return false;
}

function isEscaped(
    value: string,
    index: number,
): boolean {
    let backslashCount = 0;

    for (
        let current = index - 1;
        current >= 0 &&
        value[current] === "\\";
        current--
    ) {
        backslashCount++;
    }

    return backslashCount % 2 === 1;
}
