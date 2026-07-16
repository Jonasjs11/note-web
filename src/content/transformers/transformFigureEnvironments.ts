import type {
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createFigureToken,
} from "../commands/CommandToken";

import {
    createReferenceAnchor,
} from "../references/createReferenceAnchor";

import {
    findFigureAsset,
} from "../registry/figureAssetRegistry";

import type {
    SourceTransformContext,
} from "./Transformer";

import {
    transformMarkdownText,
} from "./transformMarkdownText";

export function transformFigureEnvironments(
    source: string,
    _filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    let figureIndex = 0;

    const transformedSource =
        transformMarkdownText(
            source,
            (text) => {
                return transformFiguresInText(
                    text,
                    context,
                    figureIndex,
                    (nextIndex) => {
                        figureIndex = nextIndex;
                    },
                );
            },
        );

    return {
        value: transformedSource,
        diagnostics: [],
    };
}

function transformFiguresInText(
    text: string,
    context: SourceTransformContext,
    initialFigureIndex: number,
    updateFigureIndex: (
        nextIndex: number,
    ) => void,
): string {
    let figureIndex =
        initialFigureIndex;

    const figurePattern =
        /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;

    const transformed = text.replace(
        figurePattern,
        (
            _completeFigure: string,
            figureContent: string,
        ) => {
            const numberedFigure =
                context.numberedFigures[
                    figureIndex++
                ];

            if (!numberedFigure) {
                /*
                 * Remove the unsupported raw environment
                 * even if analysis and transformation have
                 * become unsynchronised.
                 */
                return createFigureToken({
                    imagePath: "",
                    caption:
                        "Invalid figure",
                    number: "?",
                    anchorId:
                        "invalid-figure",
                });
            }

            const imagePath =
                extractImagePath(
                    figureContent,
                );

            const imageUrl = imagePath
                ? findFigureAsset(
                      imagePath,
                  )
                : undefined;

            const anchorId =
                numberedFigure.label
                    ? createReferenceAnchor(
                          numberedFigure.label,
                      )
                    : `figure-${numberedFigure.number}`;

            return (
                "\n\n" +
                createFigureToken({
                    imageUrl,
                    imagePath:
                        imagePath ?? "",
                    caption:
                        numberedFigure.caption,
                    number:
                        numberedFigure.number.toString(),
                    anchorId,
                    width: numberedFigure.width,
                }) +
                "\n\n"
            );
        },
    );

    updateFigureIndex(figureIndex);

    return transformed;
}

function extractImagePath(
    figureContent: string,
): string | undefined {
    const match = figureContent.match(
        /\\includegraphics(?:\[[^\]]*\])?\{([^{}]*)\}/,
    );

    const path =
        match?.[1].trim();

    return path || undefined;
}