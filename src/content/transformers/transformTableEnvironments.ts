import type {
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createTableToken,
} from "../commands/CommandToken";

import {
    createReferenceAnchor,
} from "../references/createReferenceAnchor";

import type {
    SourceTransformContext,
} from "./Transformer";

import {
    findLatexCommands,
} from "../parser/findLatexCommands";

import {
    maskSourceRanges,
} from "../parser/maskSourceRanges";

import {
    escapeCommandTokenPipes,
} from "../tables/escapeCommandTokenPipes";

import {
    findMarkdownTables,
} from "../tables/findMarkdownTables";

/*
 * Unlike inline command transformers, table environments must be
 * matched against the complete source string. A GFM table and the
 * command tokens inside its cells may otherwise split the environment
 * into separate Markdown text regions before this transformer runs.
 */
export function transformTableEnvironments(
    source: string,
    _filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    return {
        value: transformTablesInSource(
            source,
            context,
        ),
        diagnostics: [],
    };
}

function transformTablesInSource(
    source: string,
    context: SourceTransformContext,
): string {
    let tableIndex = 0;

    const tablePattern =
        /\\begin\{table\}([\s\S]*?)\\end\{table\}/g;

    return source.replace(
        tablePattern,
        (
            _completeTable: string,
            tableContent: string,
        ) => {
            const numberedTable =
                context.numberedTables[
                    tableIndex++
                ];

            if (!numberedTable) {
                return (
                    "\n\n" +
                    createTableToken({
                        markdown: "",
                        caption:
                            "Invalid table",
                        number: "?",
                        anchorId:
                            "invalid-table",
                    }) +
                    "\n\n"
                );
            }

            const markdownTables =
                findMarkdownTables(
                    tableContent,
                );

            const metadataContent =
                maskSourceRanges(
                    tableContent,
                    markdownTables,
                );

            const transformedCaption =
                extractCaption(
                    metadataContent,
                ) ??
                numberedTable.caption;

            const markdown =
                markdownTables[0]?.source ??
                numberedTable.markdown;

            const anchorId =
                numberedTable.label
                    ? createReferenceAnchor(
                          numberedTable.label,
                      )
                    : `table-${numberedTable.number}`;

            return (
                "\n\n" +
                createTableToken({
                    /*
                     * Concept/reference tokens contain literal pipe
                     * separators. Escape them until GFM has finished
                     * determining the table's cell boundaries.
                     */
                    markdown:
                        escapeCommandTokenPipes(
                            markdown,
                        ),
                    caption:
                        transformedCaption,
                    number:
                        numberedTable.number.toString(),
                    anchorId,
                    sourceUrl:
                        numberedTable
                            .sourceReference
                            ?.url,
                    sourceSiteName:
                        numberedTable
                            .sourceReference
                            ?.siteName,
                }) +
                "\n\n"
            );
        },
    );
}

function extractCaption(
    metadataContent: string,
): string | undefined {
    const captionMatch =
        findLatexCommands(
            metadataContent,
            "caption",
        )[0];

    const caption =
        captionMatch?.value.trim();

    return caption || undefined;
}
