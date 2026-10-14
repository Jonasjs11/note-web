import type {
    CommandRenderer,
} from "../CommandRenderer";

import type {
    FigureSubfigureCommandData,
} from "../CommandToken";

import InlineMarkdownRenderer
    from "../../../components/Markdown/InlineMarkdownRenderer";

import {
    getSourceHostname,
} from "../../sources/getSourceHostName";

import FigurePdfViewer from "../../../components/Figures/FigurePdfViewer";

import FigureImage
    from "../../../components/Figures/FigureImage";

const FigureCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const imageUrl =
                arguments_[0];

            const imagePath =
                arguments_[1];

            const caption =
                arguments_[2];

            const number =
                arguments_[3];

            const anchorId =
                arguments_[4];

            const width =
                arguments_[5];

            const sourceUrl =
                arguments_[6];

            const sourceSiteName =
                arguments_[7];

            const subfigures =
                parseSubfigures(
                    arguments_[8],
                );

            const hasSubfigureSources =
            subfigures.some(
                (subfigure) =>
                    Boolean(
                        subfigure.sourceUrl,
                    ),
            );

            const subfigureGap =
                arguments_[9];
            const pdfview = arguments_[10] === "pdfview";
            const pdfHeight = arguments_[11] || undefined;

            if (
                !number ||
                !anchorId
            ) {
                return (
                    <div className="command-error">
                        Invalid figure
                    </div>
                );
            }

            return (
                <figure
                    id={anchorId}
                    className="note-figure"
                >
                    {subfigures.length > 0 ? (
                        <div
                            className={
                                hasSubfigureSources
                                    ? "note-figure__subfigures note-figure__subfigures--with-sources"
                                    : "note-figure__subfigures"
                            }
                            style={{
                                gridTemplateColumns:
                                    buildSubfigureColumns(
                                        subfigures,
                                    ),
                                columnGap:
                                    subfigureGap ||
                                    undefined,
                            }}
                        >
                            {subfigures.map(
                                (subfigure) => (
                                    <div
                                        key={
                                            subfigure.anchorId
                                        }
                                        id={
                                            subfigure.anchorId
                                        }
                                        className={
                                            hasSubfigureSources
                                                ? "note-subfigure note-subfigure--with-source-row"
                                                : "note-subfigure"
                                        }
                                    >
                                        <div className="note-subfigure__media">
                                        {subfigure.imageUrl ? (
                                            <FigureImage
                                                imageUrl={
                                                    subfigure.imageUrl
                                                }
                                                imagePath={
                                                    subfigure.imagePath
                                                }
                                                caption={
                                                    subfigure.caption
                                                }
                                                number={
                                                    `${number}${subfigure.letter}`
                                                }
                                                width={
                                                    subfigure.imageWidth ||
                                                    "100%"
                                                }
                                            />
                                        ) : (
                                            <div className="note-figure__error">
                                                Unable to find image
                                                {subfigure.imagePath
                                                    ? ` "${subfigure.imagePath}".`
                                                    : "."}
                                            </div>
                                        )}
                                        </div>

                                        <div className="note-subfigure__caption">
                                            <span className="note-subfigure__letter">
                                                ({subfigure.letter})
                                            </span>

                                            {subfigure.caption && (
                                                <>
                                                    {" "}
                                                    <InlineMarkdownRenderer
                                                        source={
                                                            subfigure.caption
                                                        }
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <FigureSource
                                            sourceUrl={
                                                subfigure.sourceUrl
                                            }
                                            sourceSiteName={
                                                subfigure.sourceSiteName
                                            }
                                            className="note-subfigure__source"
                                            reserveSpace={
                                                hasSubfigureSources
                                            }
                                        />
                                    </div>
                                ),
                            )}
                        </div>
                    ) : imageUrl && pdfview ? (
                        <FigurePdfViewer
                            url={imageUrl}
                            width={width || undefined}
                            height={pdfHeight}
                            title={caption || `Figure ${number}`}
                        />
                    ) : imageUrl ? (
                        <FigureImage
                            imageUrl={imageUrl}
                            imagePath={imagePath}
                            caption={caption}
                            number={number}
                            width={
                                width ||
                                undefined
                            }
                        />
                    ) : (
                        <div className="note-figure__error">
                            Unable to find image
                            {imagePath
                                ? ` "${imagePath}".`
                                : "."}
                        </div>
                    )}

                    <figcaption>
                        Figure {number}.
                        {caption && (
                            <>
                                {" "}
                                <InlineMarkdownRenderer
                                    source={caption}
                                />
                            </>
                        )}
                    </figcaption>

                    <FigureSource
                        sourceUrl={sourceUrl}
                        sourceSiteName={
                            sourceSiteName
                        }
                        className="note-figure__source"
                    />
                </figure>
            );
        },
    };

interface FigureSourceProps {
    sourceUrl?: string;
    sourceSiteName?: string;
    className: string;
    reserveSpace?: boolean;
}

function FigureSource({
    sourceUrl,
    sourceSiteName,
    className,
    reserveSpace = false,
}: FigureSourceProps) {
    if (!sourceUrl) {
        return reserveSpace
            ? (
                  <div
                      className={className}
                      aria-hidden="true"
                  />
              )
            : null;
    }

    const sourceHostname =
        getSourceHostname({
            kind: "web",
            url: sourceUrl,
            siteName:
                sourceSiteName ||
                undefined,
        });

    const sourceText = sourceSiteName
        ? `${sourceSiteName} (${sourceHostname})`
        : sourceHostname;

    return (
        <div className={className}>
            Source:{" "}
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                {sourceText}
            </a>
        </div>
    );
}

function buildSubfigureColumns(
    subfigures: FigureSubfigureCommandData[],
): string {
    return subfigures
        .map((subfigure) => {
            return subfigure.width
                ? `minmax(0, ${subfigure.width})`
                : "minmax(0, 1fr)";
        })
        .join(" ");
}

function parseSubfigures(
    serializedSubfigures: string | undefined,
): FigureSubfigureCommandData[] {
    if (!serializedSubfigures) {
        return [];
    }

    try {
        const parsed: unknown =
            JSON.parse(
                serializedSubfigures,
            );

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (
                value,
            ): value is FigureSubfigureCommandData => {
                if (
                    !value ||
                    typeof value !== "object"
                ) {
                    return false;
                }

                const candidate = value as {
                    imagePath?: unknown;
                    letter?: unknown;
                    anchorId?: unknown;
                };

                return (
                    typeof candidate.imagePath ===
                        "string" &&
                    typeof candidate.letter ===
                        "string" &&
                    typeof candidate.anchorId ===
                        "string"
                );
            },
        );
    } catch {
        return [];
    }
}

export default FigureCommandRenderer;
