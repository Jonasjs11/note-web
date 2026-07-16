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

        const caption = analyzeCaption(
            source,
            filePath,
            figureContent,
            contentStart,
            diagnostics,
        );

        const sourceReference = analyzeFigureSource(
            source,
            filePath,
            figureContent,
            contentStart,
            diagnostics,
        );

        const label = analyzeFigureLabel(
            source,
            filePath,
            figureContent,
            contentStart,
            figureNumber,
            targetsByLabel,
            targets,
            diagnostics,
        );

        const width = extractFigureWidth(
            figureContent,
        );

        numberedFigures.push({
            number: figureNumber,
            caption,
            label,
            width,
            sourceReference,

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

function analyzeCaption(
    completeSource: string,
    filePath: string,
    figureContent: string,
    figureContentStart: number,
    diagnostics: Diagnostic[],
): string | undefined {
    const captionMatches =
        findLatexCommands(
            figureContent,
            "caption",
        );

    if (captionMatches.length === 0) {
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
                    "A figure may only have one caption.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
                        (extraCaption.startOffset),
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
                "The figure caption is empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                figureContentStart +
                    (firstCaption.startOffset ?? 0),
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
                    "A figure may only have one source.",
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
                "A figure source URL cannot be empty.",
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
                "A figure source must be an absolute " +
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
    figureNumber: number,
    targetsByLabel: Map<
        string,
        ReferenceTarget
    >,
    targets: ReferenceTarget[],
    diagnostics: Diagnostic[],
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
                    "A figure may only have one label.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    figureContentStart +
                        (extraLabel.startOffset),
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
        (firstLabel.startOffset ?? 0);

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                "A figure label cannot be empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                labelIndex,
            ),
        });

        return undefined;
    }

    if (!label.startsWith("fig:")) {
        diagnostics.push({
            severity: "warning",
            message:
                `Figure label "${label}" ` +
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

        number: {
            primary: figureNumber,
        },

        anchorId:
            createReferenceAnchor(label),
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

function normalizeFigureWidth(
    width: string,
): string | undefined {
    const textWidthMatch =
        width.match(
            /^(\d*\.?\d+)\\textwidth$/,
        );

    if (textWidthMatch) {
        const fraction =
            Number(textWidthMatch[1]);

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
            width,
        )
    ) {
        return width;
    }

    return undefined;
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