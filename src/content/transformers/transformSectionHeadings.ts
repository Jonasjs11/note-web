import type {
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createSectionAnchorToken,
} from "../commands/CommandToken";

import {
    findMarkdownHeadings,
} from "../sections/findMarkdownHeadings";

import type {
    SourceTransformContext,
} from "./Transformer";

/**
 * Removes authored section labels from headings and inserts the
 * semantic anchor selected by section analysis.
 */
export function transformSectionHeadings(
    source: string,
    _filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    const headings =
        findMarkdownHeadings(source);

    let transformedSource = source;

    /*
     * Apply replacements from the end so original source offsets stay
     * valid throughout the transformation.
     */
    for (
        let index = headings.length - 1;
        index >= 0;
        index--
    ) {
        const heading = headings[index];
        const section =
            context.sections[index];

        if (!section) {
            continue;
        }

        const replacement =
            heading.indentation +
            "#".repeat(heading.level) +
            " " +
            createSectionAnchorToken(
                section.anchorId,
            ) +
            section.title +
            heading.lineEnding;

        transformedSource =
            transformedSource.slice(
                0,
                heading.startOffset,
            ) +
            replacement +
            transformedSource.slice(
                heading.endOffset,
            );
    }

    return {
        value: transformedSource,
        diagnostics: [],
    };
}
