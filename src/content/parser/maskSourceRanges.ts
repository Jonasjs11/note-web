export interface SourceRange {
    startOffset: number;
    endOffset: number;
}

export function maskSourceRanges(
    source: string,
    ranges: SourceRange[],
): string {
    if (ranges.length === 0) {
        return source;
    }

    const sortedRanges = [...ranges].sort(
        (left, right) =>
            left.startOffset - right.startOffset,
    );

    let result = "";
    let currentOffset = 0;

    for (const range of sortedRanges) {
        const startOffset = Math.max(
            currentOffset,
            range.startOffset,
        );

        const endOffset = Math.max(
            startOffset,
            range.endOffset,
        );

        result += source.slice(
            currentOffset,
            startOffset,
        );

        result += source
            .slice(startOffset, endOffset)
            .replace(/[^\r\n]/g, " ");

        currentOffset = endOffset;
    }

    result += source.slice(currentOffset);

    return result;
}
