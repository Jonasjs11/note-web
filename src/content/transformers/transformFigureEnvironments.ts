import type {
    DiagnosticResult,
} from "../models/Diagnostic";

import {
    createFigureToken,
} from "../commands/CommandToken";

import type {
    FigureSubfigureCommandData,
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

import {
    findLatexCommands,
} from "../parser/findLatexCommands";

import {
    isWebUrl,
} from "../sources/isWebUrl";

import {
    findSubfigureEnvironments,
} from "../figures/findSubfigureEnvironments";

import {
    maskSourceRanges,
} from "../parser/maskSourceRanges";

import type {
    NumberedFigure,
} from "../references/NumberedFigure";

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
                return createFigureToken({
                    imagePath: "",
                    caption:
                        "Invalid figure",
                    number: "?",
                    anchorId:
                        "invalid-figure",
                });
            }

            const subfigureEnvironments =
                findSubfigureEnvironments(
                    figureContent,
                );

            const outerFigureContent =
                maskSourceRanges(
                    figureContent,
                    subfigureEnvironments,
                );

            const hasSubfigures =
                numberedFigure.subfigures.length > 0;

            const imagePath = hasSubfigures
                ? undefined
                : extractImagePath(
                      outerFigureContent,
                  );

            const imageUrl =
                resolveImageUrl(imagePath);

            const anchorId =
                numberedFigure.label
                    ? createReferenceAnchor(
                          numberedFigure.label,
                      )
                    : `figure-${numberedFigure.number}`;

            const transformedCaption =
                extractCaption(
                    outerFigureContent,
                ) ??
                numberedFigure.caption;

            const subfigures =
                buildSubfigureCommandData(
                    numberedFigure,
                    subfigureEnvironments,
                    anchorId,
                );

            return (
                "\n\n" +
                createFigureToken({
                    imageUrl,
                    imagePath:
                        imagePath ?? "",
                    caption:
                        transformedCaption,
                    number:
                        numberedFigure.number.toString(),
                    anchorId,
                    width:
                        numberedFigure.width,
                    sourceUrl:
                        numberedFigure
                            .sourceReference
                            ?.url,
                    sourceSiteName:
                        numberedFigure
                            .sourceReference
                            ?.siteName,
                    subfigures,
                    subfigureGap:
                        numberedFigure
                            .subfigureGap,
                }) +
                "\n\n"
            );
        },
    );

    updateFigureIndex(figureIndex);

    return transformed;
}

function buildSubfigureCommandData(
    numberedFigure: NumberedFigure,
    environments: ReturnType<
        typeof findSubfigureEnvironments
    >,
    figureAnchorId: string,
): FigureSubfigureCommandData[] {
    return environments.map(
        (environment, index) => {
            const numberedSubfigure =
                numberedFigure.subfigures[
                    index
                ];

            const letter =
                numberedSubfigure?.letter ??
                `${index + 1}`;

            const imagePath =
                extractImagePath(
                    environment.content,
                );

            const anchorId =
                numberedSubfigure?.label
                    ? createReferenceAnchor(
                          numberedSubfigure.label,
                      )
                    : `${figureAnchorId}-${letter}`;

            return {
                imageUrl:
                    resolveImageUrl(
                        imagePath,
                    ),
                imagePath:
                    imagePath ?? "",
                caption:
                    extractCaption(
                        environment.content,
                    ) ??
                    numberedSubfigure
                        ?.caption,
                letter,
                anchorId,
                width:
                    numberedSubfigure
                        ?.width,
                imageWidth:
                    numberedSubfigure
                        ?.imageWidth ??
                    "100%",
                sourceUrl:
                    numberedSubfigure
                        ?.sourceReference
                        ?.url,
                sourceSiteName:
                    numberedSubfigure
                        ?.sourceReference
                        ?.siteName,
            };
        },
    );
}

function resolveImageUrl(
    imagePath: string | undefined,
): string | undefined {
    if (!imagePath) {
        return undefined;
    }

    return isWebUrl(imagePath)
        ? imagePath
        : findFigureAsset(imagePath);
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

function extractCaption(
    figureContent: string,
): string | undefined {
    const captionMatch =
        findLatexCommands(
            figureContent,
            "caption",
        )[0];

    const caption =
        captionMatch?.value.trim();

    return caption || undefined;
}
