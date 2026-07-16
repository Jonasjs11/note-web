import type {
    MarkdownHeading,
    SectionHeadingLevel,
} from "./MarkdownHeading";

interface ActiveFence {
    marker: "`" | "~";
    length: number;
}

/**
 * Finds ATX Markdown headings from h2 through h6.
 *
 * Fenced code blocks are skipped so documentation examples do not
 * become real document sections. The first h1 remains the note title
 * and is intentionally not returned.
 */
export function findMarkdownHeadings(
    source: string,
): MarkdownHeading[] {
    const headings: MarkdownHeading[] = [];

    let offset = 0;
    let activeFence: ActiveFence | undefined;

    for (const lineWithEnding of source.matchAll(/.*(?:\r\n|\n|\r|$)/g)) {
        if (!lineWithEnding[0]) {
            continue;
        }

        const completeLine = lineWithEnding[0];
        const lineEnding =
            completeLine.match(/\r\n|\n|\r$/)?.[0] ?? "";

        const line = lineEnding
            ? completeLine.slice(0, -lineEnding.length)
            : completeLine;

        const fence = readFence(line);

        if (activeFence) {
            if (
                fence &&
                fence.marker === activeFence.marker &&
                fence.length >= activeFence.length
            ) {
                activeFence = undefined;
            }

            offset += completeLine.length;
            continue;
        }

        if (fence) {
            activeFence = fence;
            offset += completeLine.length;
            continue;
        }

        const headingMatch = line.match(
            /^( {0,3})(#{2,6})(?:[ \t]+|$)(.*)$/,
        );

        if (!headingMatch) {
            offset += completeLine.length;
            continue;
        }

        const indentation = headingMatch[1];
        const hashes = headingMatch[2];
        const content = removeClosingHashes(
            headingMatch[3],
        );

        const separatorLength =
            line
                .slice(
                    indentation.length +
                        hashes.length,
                )
                .match(/^[ \t]*/)?.[0]
                .length ?? 0;

        headings.push({
            level: hashes.length as SectionHeadingLevel,
            source: line,
            content,
            indentation,
            startOffset: offset,
            contentStartOffset:
                offset +
                indentation.length +
                hashes.length +
                separatorLength,
            endOffset: offset + completeLine.length,
            lineEnding,
        });

        offset += completeLine.length;
    }

    return headings;
}

function readFence(
    line: string,
): ActiveFence | undefined {
    const match = line.match(
        /^ {0,3}(`{3,}|~{3,})/,
    );

    if (!match) {
        return undefined;
    }

    const run = match[1];

    return {
        marker: run[0] as "`" | "~",
        length: run.length,
    };
}

function removeClosingHashes(
    content: string,
): string {
    return content
        .replace(/[ \t]+#+[ \t]*$/, "")
        .trimEnd();
}
