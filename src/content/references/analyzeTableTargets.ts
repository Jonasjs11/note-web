import type {
    Diagnostic,
} from "../models/Diagnostic";

import {
    getSourceLocation,
} from "../parser/getSourceLocation";

import {
    createReferenceAnchor,
} from "./createReferenceAnchor";

import type {
    NumberedTable,
} from "./NumberedTable";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

import type {
    TableAnalysis,
} from "./TableAnalysis";

import {
    findLatexCommands,
} from "../parser/findLatexCommands";

import {
    maskSourceRanges,
} from "../parser/maskSourceRanges";

import {
    findMarkdownTables,
} from "../tables/findMarkdownTables";

import type {
    SourceReference,
} from "../sources/SourceReference";

import {
    isWebUrl,
} from "../sources/isWebUrl";

export function analyzeTableTargets(
    source: string,
    filePath: string,
    existingTargets: ReferenceTarget[] = [],
): TableAnalysis {
    const numberedTables: NumberedTable[] = [];
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const targetsByLabel =
        new Map<string, ReferenceTarget>(
            existingTargets.map(
                (target) => [
                    target.label,
                    target,
                ],
            ),
        );

    const tablePattern =
        /\\begin\{table\}([\s\S]*?)\\end\{table\}/g;

    let tableNumber = 0;

    for (
        const tableMatch of
            source.matchAll(tablePattern)
    ) {
        tableNumber++;

        const completeTable =
            tableMatch[0];

        const tableContent =
            tableMatch[1];

        const tableStart =
            tableMatch.index ?? 0;

        const tableEnd =
            tableStart +
            completeTable.length;

        const contentOffset =
            completeTable.indexOf(
                tableContent,
            );

        const contentStart =
            tableStart +
            contentOffset;

        const markdownTables =
            findMarkdownTables(
                tableContent,
            );

        analyzeMarkdownTableCount(
            source,
            filePath,
            contentStart,
            markdownTables,
            diagnostics,
        );

        /*
         * Metadata commands must not be discovered inside table
         * cells. Masking retains source offsets for diagnostics.
         */
        const metadataContent =
            maskSourceRanges(
                tableContent,
                markdownTables,
            );

        const caption = analyzeCaption(
            source,
            filePath,
            metadataContent,
            contentStart,
            diagnostics,
        );

        const sourceReference =
            analyzeTableSource(
                source,
                filePath,
                metadataContent,
                contentStart,
                diagnostics,
            );

        const label = analyzeTableLabel(
            source,
            filePath,
            metadataContent,
            contentStart,
            tableNumber,
            targetsByLabel,
            targets,
            diagnostics,
        );

        numberedTables.push({
            number: tableNumber,
            caption,
            label,
            sourceReference,
            markdown:
                markdownTables[0]
                    ?.source ?? "",
            source:
                completeTable,
            startOffset:
                tableStart,
            endOffset:
                tableEnd,
        });
    }

    return {
        numberedTables,
        targets,
        diagnostics,
    };
}

function analyzeMarkdownTableCount(
    completeSource: string,
    filePath: string,
    tableContentStart: number,
    markdownTables: ReturnType<
        typeof findMarkdownTables
    >,
    diagnostics: Diagnostic[],
): void {
    if (markdownTables.length === 0) {
        diagnostics.push({
            severity: "error",
            message:
                "A table environment must contain one Markdown table.",
            filePath,
            location: getSourceLocation(
                completeSource,
                tableContentStart,
            ),
        });

        return;
    }

    if (markdownTables.length === 1) {
        return;
    }

    for (
        const extraTable of
            markdownTables.slice(1)
    ) {
        diagnostics.push({
            severity: "error",
            message:
                "A table environment may only contain one Markdown table.",
            filePath,
            location: getSourceLocation(
                completeSource,
                tableContentStart +
                    extraTable.startOffset,
            ),
        });
    }
}

function analyzeCaption(
    completeSource: string,
    filePath: string,
    metadataContent: string,
    contentStart: number,
    diagnostics: Diagnostic[],
): string | undefined {
    const captionMatches =
        findLatexCommands(
            metadataContent,
            "caption",
        );

    if (captionMatches.length === 0) {
        diagnostics.push({
            severity: "warning",
            message:
                "A numbered table should have a caption.",
            filePath,
            location: getSourceLocation(
                completeSource,
                contentStart,
            ),
        });

        return undefined;
    }

    if (captionMatches.length > 1) {
        for (
            const extraCaption of
                captionMatches.slice(1)
        ) {
            diagnostics.push({
                severity: "error",
                message:
                    "A table may only have one caption.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    contentStart +
                        extraCaption.startOffset,
                ),
            });
        }
    }

    const firstCaption =
        captionMatches[0];

    const caption =
        firstCaption.value.trim();

    if (!caption) {
        diagnostics.push({
            severity: "warning",
            message:
                "The table caption is empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                contentStart +
                    firstCaption.startOffset,
            ),
        });

        return undefined;
    }

    return caption;
}

function analyzeTableLabel(
    completeSource: string,
    filePath: string,
    metadataContent: string,
    contentStart: number,
    tableNumber: number,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
): string | undefined {
    const labelMatches =
        findLatexCommands(
            metadataContent,
            "label",
        );

    if (labelMatches.length === 0) {
        return undefined;
    }

    if (labelMatches.length > 1) {
        for (
            const extraLabel of
                labelMatches.slice(1)
        ) {
            diagnostics.push({
                severity: "error",
                message:
                    "A table may only have one label.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    contentStart +
                        extraLabel.startOffset,
                ),
            });
        }
    }

    const firstLabel =
        labelMatches[0];

    const label =
        firstLabel.value.trim();

    const labelIndex =
        contentStart +
        firstLabel.startOffset;

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                "A table label cannot be empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                labelIndex,
            ),
        });

        return undefined;
    }

    if (!label.startsWith("tab:")) {
        diagnostics.push({
            severity: "warning",
            message:
                `Table label "${label}" ` +
                `should begin with "tab:".`,
            filePath,
            location: getSourceLocation(
                completeSource,
                labelIndex,
            ),
        });
    }

    if (targetsByLabel.has(label)) {
        diagnostics.push({
            severity: "error",
            message:
                `Duplicate label "${label}".`,
            filePath,
            location: getSourceLocation(
                completeSource,
                labelIndex,
            ),
        });

        return undefined;
    }

    const target: ReferenceTarget = {
        label,
        type: "table",
        number: {
            primary: tableNumber,
        },
        anchorId:
            createReferenceAnchor(label),
    };

    targetsByLabel.set(label, target);
    targets.push(target);

    return label;
}

function analyzeTableSource(
    completeSource: string,
    filePath: string,
    metadataContent: string,
    contentStart: number,
    diagnostics: Diagnostic[],
): SourceReference | undefined {
    const sourceMatches =
        findLatexCommands(
            metadataContent,
            "source",
        );

    if (sourceMatches.length === 0) {
        return undefined;
    }

    if (sourceMatches.length > 1) {
        for (
            const extraSource of
                sourceMatches.slice(1)
        ) {
            diagnostics.push({
                severity: "error",
                message:
                    "A table may only have one source.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    contentStart +
                        extraSource.startOffset,
                ),
            });
        }
    }

    const firstSource =
        sourceMatches[0];

    const url =
        firstSource.value.trim();

    const sourceIndex =
        contentStart +
        firstSource.startOffset;

    if (!url) {
        diagnostics.push({
            severity: "error",
            message:
                "A table source URL cannot be empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                sourceIndex,
            ),
        });

        return undefined;
    }

    if (!isWebUrl(url)) {
        diagnostics.push({
            severity: "error",
            message:
                "A table source must be an absolute " +
                "HTTP or HTTPS URL.",
            filePath,
            location: getSourceLocation(
                completeSource,
                sourceIndex,
            ),
        });

        return undefined;
    }

    const optionalSiteName =
        readOptionalSquareArgument(
            metadataContent,
            firstSource.endOffset,
        );

    if (
        optionalSiteName.kind ===
        "unclosed"
    ) {
        diagnostics.push({
            severity: "error",
            message:
                "The optional source site name " +
                "is missing its closing bracket.",
            filePath,
            location: getSourceLocation(
                completeSource,
                contentStart +
                    optionalSiteName.startOffset,
            ),
        });
    }

    const siteName =
        optionalSiteName.kind === "value"
            ? optionalSiteName.value.trim()
            : undefined;

    if (
        optionalSiteName.kind === "value" &&
        !siteName
    ) {
        diagnostics.push({
            severity: "warning",
            message:
                "The optional source site name is empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                contentStart +
                    optionalSiteName.startOffset,
            ),
        });
    }

    return {
        kind: "web",
        url,
        siteName:
            siteName || undefined,
    };
}

type OptionalSquareArgument =
    | {
          kind: "none";
      }
    | {
          kind: "value";
          value: string;
          startOffset: number;
      }
    | {
          kind: "unclosed";
          startOffset: number;
      };

function readOptionalSquareArgument(
    source: string,
    startOffset: number,
): OptionalSquareArgument {
    let index = startOffset;

    while (
        index < source.length &&
        /\s/.test(source[index])
    ) {
        index++;
    }

    if (source[index] !== "[") {
        return {
            kind: "none",
        };
    }

    const openingBracket = index;
    const valueStart = openingBracket + 1;

    for (
        index = valueStart;
        index < source.length;
        index++
    ) {
        if (
            source[index] === "\\" &&
            index + 1 < source.length
        ) {
            index++;
            continue;
        }

        if (source[index] !== "]") {
            continue;
        }

        return {
            kind: "value",
            value: source.slice(
                valueStart,
                index,
            ),
            startOffset:
                openingBracket,
        };
    }

    return {
        kind: "unclosed",
        startOffset:
            openingBracket,
    };
}
