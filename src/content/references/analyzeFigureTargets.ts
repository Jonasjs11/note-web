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
    const captionPattern =
        /\\caption\{([^{}]*)\}/g;

    const captionMatches = [
        ...figureContent.matchAll(
            captionPattern,
        ),
    ];

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
                        (extraCaption.index ?? 0),
                ),
            });
        }
    }

    const firstCaption =
        captionMatches[0];

    const caption =
        firstCaption[1].trim();

    if (!caption) {
        diagnostics.push({
            severity: "warning",
            message:
                "The figure caption is empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                figureContentStart +
                    (firstCaption.index ?? 0),
            ),
        });

        return undefined;
    }

    return caption;
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
    const labelPattern =
        /\\label\{([^{}]*)\}/g;

    const labelMatches = [
        ...figureContent.matchAll(
            labelPattern,
        ),
    ];

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
                        (extraLabel.index ?? 0),
                ),
            });
        }
    }
    
    const firstLabel =
        labelMatches[0];

    const label =
        firstLabel[1].trim();

    const labelIndex =
        figureContentStart +
        (firstLabel.index ?? 0);

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