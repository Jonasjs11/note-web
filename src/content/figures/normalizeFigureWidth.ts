export function normalizeFigureWidth(
    width: string,
): string | undefined {
    const trimmedWidth = width.trim();

    if (
        trimmedWidth === "\\textwidth" ||
        trimmedWidth === "\\linewidth" ||
        trimmedWidth === "\\columnwidth"
    ) {
        return "100%";
    }

    const relativeWidthMatch =
        trimmedWidth.match(
            /^(\d*\.?\d+)\\(?:textwidth|linewidth|columnwidth)$/,
        );

    if (relativeWidthMatch) {
        const fraction =
            Number(relativeWidthMatch[1]);

        if (
            Number.isFinite(fraction) &&
            fraction > 0
        ) {
            return `${fraction * 100}%`;
        }

        return undefined;
    }

    if (
        /^\d*\.?\d+(%|px|rem|em|vw)$/.test(
            trimmedWidth,
        )
    ) {
        return trimmedWidth;
    }

    return undefined;
}
