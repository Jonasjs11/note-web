import type {
    NumberedEquation,
} from "../references/NumberedEquation";

import {
    formatReferenceNumber,
} from "../references/formatReferenceNumber";

import {
    splitAlignRows,
} from "../references/splitAlignRows";

/**
 * Makes the analyzer the single source of truth for
 * visible equation numbering.
 *
 * It:
 *
 * - removes unsupported subequations wrappers;
 * - adds explicit tags to ordinary equations;
 * - adds explicit tags to every align row.
 */
export function transformEquationNumbers(
    source: string,
    numberedEquations: NumberedEquation[],
): string {
    const sourceWithoutSubequations =
        removeSubequationWrappers(source);

    let equationIndex = 0;

    const environmentPattern =
        /\\begin\{(equation|align)\}([\s\S]*?)\\end\{\1\}/g;

    return sourceWithoutSubequations.replace(
        environmentPattern,
        (
            completeEnvironment: string,
            environmentType:
                | "equation"
                | "align",
            environmentContent: string,
        ) => {
            if (
                environmentType ===
                "equation"
            ) {
                const numberedEquation =
                    numberedEquations[
                        equationIndex++
                    ];

                if (!numberedEquation) {
                    return completeEnvironment;
                }

                return replaceEnvironmentContent(
                    completeEnvironment,
                    environmentContent,
                    addTag(
                        environmentContent,
                        formatReferenceNumber(
                            numberedEquation.number,
                        ),
                    ),
                );
            }

            const rows =
                splitAlignRows(
                    environmentContent,
                );

            let transformedContent =
                environmentContent;

            /*
             * Replace backwards so the original row
             * offsets remain valid.
             */
            for (
                let rowIndex =
                    rows.length - 1;
                rowIndex >= 0;
                rowIndex--
            ) {
                const numberedEquation =
                    numberedEquations[
                        equationIndex +
                        rowIndex
                    ];

                if (!numberedEquation) {
                    continue;
                }

                const row = rows[rowIndex];

                const transformedRow =
                    addTag(
                        row.source,
                        formatReferenceNumber(
                            numberedEquation.number,
                        ),
                    );

                transformedContent =
                    transformedContent.slice(
                        0,
                        row.startOffset,
                    ) +
                    transformedRow +
                    transformedContent.slice(
                        row.endOffset,
                    );
            }

            equationIndex += rows.length;

            return replaceEnvironmentContent(
                completeEnvironment,
                environmentContent,
                transformedContent,
            );
        },
    );
}

function removeSubequationWrappers(
    source: string,
): string {
    return source
        .replace(
            /\\begin\{subequations\}/g,
            "",
        )
        .replace(
            /\\end\{subequations\}/g,
            "",
        );
}

function addTag(
    source: string,
    number: string,
): string {
    /*
     * Avoid creating duplicate tags if one was
     * already added during hot reload.
     */
    if (/\\tag\{[^{}]*\}/.test(source)) {
        return source;
    }

    const tag =
        `\\tag{${number}}`;

    const labelIndex =
        source.search(
            /\\label\{/,
        );

    if (labelIndex !== -1) {
        return (
            source.slice(0, labelIndex) +
            tag +
            " " +
            source.slice(labelIndex)
        );
    }

    return (
        source.trimEnd() +
        " " +
        tag
    );
}

function replaceEnvironmentContent(
    completeEnvironment: string,
    oldContent: string,
    newContent: string,
): string {
    const contentIndex =
        completeEnvironment.indexOf(
            oldContent,
        );

    return (
        completeEnvironment.slice(
            0,
            contentIndex,
        ) +
        newContent +
        completeEnvironment.slice(
            contentIndex +
                oldContent.length,
        )
    );
}