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
    FigureAnalysis,
} from "./FigureAnalysis";

import type {
    NumberedFigure,
} from "./NumberedFigure";

import type {
    NumberedSubfigure,
} from "./NumberedSubfigure";

import type {
    ReferenceNumber,
    ReferenceTarget,
} from "./ReferenceTarget";

import {
    findLatexCommands,
} from "../parser/findLatexCommands";

import type {
    SourceReference,
} from "../sources/SourceReference";

import {
    isWebUrl,
} from "../sources/isWebUrl";

import {
    findSubfigureEnvironments,
} from "../figures/findSubfigureEnvironments";

import {
    normalizeFigureWidth,
} from "../figures/normalizeFigureWidth";

import {
    maskSourceRanges,
} from "../parser/maskSourceRanges";

type FigureSubject =
    | "figure"
    | "subfigure";

export function analyzeFigureTargets(
    source: string,
    filePath: string,
    existingTargets: ReferenceTarget[] = [],
): FigureAnalysis {
    const numberedFigures:
        NumberedFigure[] = [];

    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    /*
     * Seed this with equation targets so duplicate
     * labels are detected across reference types.
     */
    const targetsByLabel =
        new Map<string, ReferenceTarget>(
            existingTargets.map(
                (target) => [
                    target.label,
                    target,
                ],
            ),
        );

    const figurePattern =
        /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;

    let figureNumber = 0;

    for (
        const figureMatch of
            source.matchAll(figurePattern)
    ) {
        figureNumber++;

        const completeFigure =
            figureMatch[0];

        const figureContent =
            figureMatch[1];

        const figureStart =
            figureMatch.index ?? 0;

        const figureEnd =
            figureStart +
            completeFigure.length;

        const contentOffset =
            completeFigure.indexOf(
                figureContent,
            );

        const contentStart =
            figureStart +
            contentOffset;

        const subfigureEnvironments =
            findSubfigureEnvironments(
                figureContent,
            );

        /*
         * Outer figure commands must not see captions,
         * labels or sources belonging to subfigures.
         * Masking preserves all original offsets.
         */
        const outerFigureContent =
            maskSourceRanges(
                figureContent,
                subfigureEnvironments,
            );

        const caption = analyzeCaption(
            source,
            filePath,
            outerFigureContent,
            contentStart,
            diagnostics,
            "figure",
            true,
        );

        const sourceReference =
            analyzeFigureSource(
                source,
                filePath,
                outerFigureContent,
                contentStart,
                diagnostics,
                "figure",
            );

        const label = analyzeFigureLabel(
            source,
            filePath,
            outerFigureContent,
            contentStart,
            {
                primary: figureNumber,
            },
            targetsByLabel,
            targets,
            diagnostics,
            "figure",
        );

        const width = extractFigureWidth(
            outerFigureContent,
        );

        const subfigureGap =
            analyzeSubfigureGap(
                source,
                filePath,
                outerFigureContent,
                contentStart,
                diagnostics,
            );

        const subfigures =
            analyzeSubfigures(
                source,
                filePath,
                contentStart,
                figureNumber,
                label,
                subfigureEnvironments,
                targetsByLabel,
                targets,
                diagnostics,
            );

        const childLabels = subfigures
            .map(
                (subfigure) =>
                    subfigure.label,
            )
            .filter(
                (
                    childLabel,
                ): childLabel is string =>
                    childLabel !== undefined,
            );

        if (
            label &&
            childLabels.length > 0
        ) {
            const parentTarget =
                targetsByLabel.get(label);

            if (parentTarget) {
                parentTarget.childLabels =
                    childLabels;
            }
        }

        numberedFigures.push({
            number: figureNumber,
            caption,
            label,
            width,
            subfigureGap,
            sourceReference,
            subfigures,

            source:
                completeFigure,

            startOffset:
                figureStart,

            endOffset:
                figureEnd,
        });
    }

    return {
        numberedFigures,
        targets,
        diagnostics,
    };
}

function analyzeSubfigureGap(
    completeSource: string,
    filePath: string,
    figureContent: string,
    figureContentStart: number,
    diagnostics: Diagnostic[],
): string | undefined {
    const gapMatches =
        findLatexCommands(
            figureContent,
            "subfiguregap",
        );

    if (gapMatches.length === 0) {
        return undefined;
    }

    if (gapMatches.length > 1) {
        for (
            const extraGap of
                gapMatches.slice(1)
        ) {
            diagnostics.push({
                severity: "error",
                message:
                    "A figure may only declare one subfigure gap.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
                        extraGap.startOffset,
                ),
            });
        }
    }

    const firstGap = gapMatches[0];
    const authoredGap =
        firstGap.value.trim();

    if (!authoredGap) {
        diagnostics.push({
            severity: "warning",
            message:
                "The subfigure gap is empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                figureContentStart +
                    firstGap.startOffset,
            ),
        });

        return undefined;
    }

    if (authoredGap === "0") {
        return "0";
    }

    const normalizedGap =
        normalizeFigureWidth(
            authoredGap,
        );

    if (!normalizedGap) {
        diagnostics.push({
            severity: "warning",
            message:
                `Unsupported subfigure gap ` +
                `"${authoredGap}".`,
            filePath,
            location: getSourceLocation(
                completeSource,
                figureContentStart +
                    firstGap.startOffset,
            ),
        });

        return undefined;
    }

    return normalizedGap;
}

function analyzeSubfigures(
    completeSource: string,
    filePath: string,
    figureContentStart: number,
    figureNumber: number,
    parentLabel: string | undefined,
    environments: ReturnType<
        typeof findSubfigureEnvironments
    >,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
): NumberedSubfigure[] {
    return environments.map(
        (environment, index) => {
            const letter =
                createSubfigureLetter(index);

            const contentStart =
                figureContentStart +
                environment.contentStartOffset;

            const caption = analyzeCaption(
                completeSource,
                filePath,
                environment.content,
                contentStart,
                diagnostics,
                "subfigure",
                false,
            );

            const sourceReference =
                analyzeFigureSource(
                    completeSource,
                    filePath,
                    environment.content,
                    contentStart,
                    diagnostics,
                    "subfigure",
                );

            const label =
                analyzeFigureLabel(
                    completeSource,
                    filePath,
                    environment.content,
                    contentStart,
                    {
                        primary:
                            figureNumber,
                        sub:
                            letter,
                    },
                    targetsByLabel,
                    targets,
                    diagnostics,
                    "subfigure",
                    parentLabel,
                );

            const authoredWidth =
                environment.authoredWidth.trim();

            const width =
                normalizeFigureWidth(
                    authoredWidth,
                );

            if (!authoredWidth) {
                diagnostics.push({
                    severity: "warning",
                    message:
                        "A subfigure should declare a width.",
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        figureContentStart +
                            environment.startOffset,
                    ),
                });
            } else if (!width) {
                diagnostics.push({
                    severity: "warning",
                    message:
                        `Unsupported subfigure width ` +
                        `"${authoredWidth}".`,
                    filePath,
                    location: getSourceLocation(
                        completeSource,
                        figureContentStart +
                            environment.startOffset,
                    ),
                });
            }

            return {
                letter,
                caption,
                label,
                width,
                imageWidth:
                    extractFigureWidth(
                        environment.content,
                    ),
                sourceReference,

                source:
                    environment.source,

                startOffset:
                    figureContentStart +
                    environment.startOffset,

                endOffset:
                    figureContentStart +
                    environment.endOffset,
            };
        },
    );
}

function analyzeCaption(
    completeSource: string,
    filePath: string,
    figureContent: string,
    figureContentStart: number,
    diagnostics: Diagnostic[],
    subject: FigureSubject,
    required: boolean,
): string | undefined {
    const captionMatches =
        findLatexCommands(
            figureContent,
            "caption",
        );

    if (captionMatches.length === 0) {
        if (required) {
            diagnostics.push({
                severity: "warning",
                message:
                    "A numbered figure should have a caption.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart,
                ),
            });
        }

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
                    `A ${subject} may only have one caption.`,
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
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
                `The ${subject} caption is empty.`,
            filePath,
            location: getSourceLocation(
                completeSource,
                figureContentStart +
                    firstCaption.startOffset,
            ),
        });

        return undefined;
    }

    return caption;
}

function analyzeFigureSource(
    completeSource: string,
    filePath: string,
    figureContent: string,
    figureContentStart: number,
    diagnostics: Diagnostic[],
    subject: FigureSubject,
): SourceReference | undefined {
    const sourceMatches =
        findLatexCommands(
            figureContent,
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
                    `A ${subject} may only have one source.`,
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
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
        figureContentStart +
        firstSource.startOffset;

    if (!url) {
        diagnostics.push({
            severity: "error",
            message:
                `A ${subject} source URL cannot be empty.`,
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
                `A ${subject} source must be an absolute ` +
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
            figureContent,
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
                figureContentStart +
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
                figureContentStart +
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

function analyzeFigureLabel(
    completeSource: string,
    filePath: string,
    figureContent: string,
    figureContentStart: number,
    number: ReferenceNumber,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
    subject: FigureSubject,
    parentLabel?: string,
): string | undefined {
    const labelMatches =
        findLatexCommands(
            figureContent,
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
                    `A ${subject} may only have one label.`,
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
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
        figureContentStart +
        firstLabel.startOffset;

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                `A ${subject} label cannot be empty.`,
            filePath,
            location: getSourceLocation(
                completeSource,
                labelIndex,
            ),
        });

        return undefined;
    }

    if (!label.startsWith("fig:")) {
        const subjectName =
            subject === "figure"
                ? "Figure"
                : "Subfigure";

        diagnostics.push({
            severity: "warning",
            message:
                `${subjectName} label "${label}" ` +
                `should begin with "fig:".`,
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
        type: "figure",
        number,
        anchorId:
            createReferenceAnchor(label),
        parentLabel,
    };

    targetsByLabel.set(label, target);
    targets.push(target);

    return label;
}

function extractFigureWidth(
    figureContent: string,
): string | undefined {
    const includeGraphicsMatch =
        figureContent.match(
            /\\includegraphics(?:\[([^\]]*)\])?\{[^{}]*\}/,
        );

    const options =
        includeGraphicsMatch?.[1];

    if (!options) {
        return undefined;
    }

    const widthMatch =
        options.match(
            /(?:^|,)\s*width\s*=\s*([^,]+)\s*(?:,|$)/,
        );

    const authoredWidth =
        widthMatch?.[1].trim();

    if (!authoredWidth) {
        return undefined;
    }

    return normalizeFigureWidth(
        authoredWidth,
    );
}

function createSubfigureLetter(
    index: number,
): string {
    let remaining = index + 1;
    let result = "";

    while (remaining > 0) {
        remaining--;

        result =
            String.fromCharCode(
                97 +
                (remaining % 26),
            ) + result;

        remaining = Math.floor(
            remaining / 26,
        );
    }

    return result;
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

    const openingBracket =
        index;

    const valueStart =
        openingBracket + 1;

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
