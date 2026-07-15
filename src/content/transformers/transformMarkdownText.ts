export type MarkdownTextTransformer = (
    text: string,
    sourceOffset: number,
) => string;

/**
 * Applies a transformation only to ordinary Markdown text.
 *
 * It preserves:
 * - fenced code blocks using backticks or tildes
 * - unclosed fenced code blocks
 * - inline code spans using one or more backticks
 */
export function transformMarkdownText(
    source: string,
    transform: MarkdownTextTransformer,
): string {
    let result = "";
    let plainTextStart = 0;
    let currentIndex = 0;

    let activeFence:
        | {
              marker: "`" | "~";
              length: number;
          }
        | undefined;

    while (currentIndex < source.length) {
        const lineEndIndex = findLineEnd(
            source,
            currentIndex,
        );

        const line = source.slice(
            currentIndex,
            lineEndIndex,
        );

        const fence = parseFence(line);

        if (!activeFence && fence) {
            result += transformInlineSafeText(
                source.slice(
                    plainTextStart,
                    currentIndex,
                ),
                plainTextStart,
                transform,
            );

            activeFence = fence;
        } else if (
            activeFence &&
            isClosingFence(line, activeFence)
        ) {
            activeFence = undefined;

            result += source.slice(
                currentIndex,
                lineEndIndex,
            );

            plainTextStart = lineEndIndex;
            currentIndex = lineEndIndex;

            continue;
        }

        if (activeFence) {
            result += source.slice(
                currentIndex,
                lineEndIndex,
            );

            plainTextStart = lineEndIndex;
        }

        currentIndex = lineEndIndex;
    }

    if (plainTextStart < source.length) {
        if (activeFence) {
            /*
             * An unclosed fence remains literal until
             * the end of the document.
             */
            result += source.slice(plainTextStart);
        } else {
            result += transformInlineSafeText(
                source.slice(plainTextStart),
                plainTextStart,
                transform,
            );
        }
    }

    return result;
}

function transformInlineSafeText(
    text: string,
    sourceOffset: number,
    transform: MarkdownTextTransformer,
): string {
    let result = "";
    let currentIndex = 0;

    while (currentIndex < text.length) {
        const codeStart = text.indexOf(
            "`",
            currentIndex,
        );

        if (codeStart === -1) {
            result += transform(
                text.slice(currentIndex),
                sourceOffset + currentIndex,
            );

            break;
        }

        result += transform(
            text.slice(currentIndex, codeStart),
            sourceOffset + currentIndex,
        );

        const delimiterLength =
            countRepeatedCharacter(
                text,
                codeStart,
                "`",
            );

        const delimiter = "`".repeat(
            delimiterLength,
        );

        const codeEnd = text.indexOf(
            delimiter,
            codeStart + delimiterLength,
        );

        if (codeEnd === -1) {
            /*
             * An unmatched inline-code delimiter is left
             * as ordinary text from this point onward.
             */
            result += transform(
                text.slice(codeStart),
                sourceOffset + codeStart,
            );

            break;
        }

        const endIndex =
            codeEnd + delimiterLength;

        result += text.slice(
            codeStart,
            endIndex,
        );

        currentIndex = endIndex;
    }

    return result;
}

function parseFence(
    line: string,
):
    | {
          marker: "`" | "~";
          length: number;
      }
    | undefined {
    const match = line.match(
        /^ {0,3}(`{3,}|~{3,})/,
    );

    if (!match) {
        return undefined;
    }

    const sequence = match[1];

    return {
        marker: sequence[0] as "`" | "~",
        length: sequence.length,
    };
}

function isClosingFence(
    line: string,
    fence: {
        marker: "`" | "~";
        length: number;
    },
): boolean {
    const escapedMarker =
        fence.marker === "`" ? "`" : "~";

    const pattern = new RegExp(
        `^ {0,3}${escapedMarker}{${fence.length},}[ \\t]*$`,
    );

    return pattern.test(
        line.replace(/\r?\n$/, ""),
    );
}

function findLineEnd(
    source: string,
    startIndex: number,
): number {
    const newlineIndex = source.indexOf(
        "\n",
        startIndex,
    );

    return newlineIndex === -1
        ? source.length
        : newlineIndex + 1;
}

function countRepeatedCharacter(
    value: string,
    startIndex: number,
    character: string,
): number {
    let count = 0;

    while (
        value[startIndex + count] === character
    ) {
        count++;
    }

    return count;
}