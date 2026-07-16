export interface SubfigureEnvironment {
    source: string;
    content: string;
    authoredWidth: string;

    startOffset: number;
    endOffset: number;
    contentStartOffset: number;
}

export function findSubfigureEnvironments(
    source: string,
): SubfigureEnvironment[] {
    const pattern =
        /\\begin\{subfigure\}\s*\{([^{}]*)\}([\s\S]*?)\\end\{subfigure\}/g;

    const environments: SubfigureEnvironment[] = [];

    for (const match of source.matchAll(pattern)) {
        const completeEnvironment = match[0];
        const authoredWidth = match[1];
        const content = match[2];
        const startOffset = match.index ?? 0;

        const widthEnd =
            completeEnvironment.indexOf(authoredWidth) +
            authoredWidth.length;

        const contentOffset =
            completeEnvironment.indexOf(
                content,
                widthEnd,
            );

        environments.push({
            source: completeEnvironment,
            content,
            authoredWidth,
            startOffset,
            endOffset:
                startOffset +
                completeEnvironment.length,
            contentStartOffset:
                startOffset + contentOffset,
        });
    }

    return environments;
}
