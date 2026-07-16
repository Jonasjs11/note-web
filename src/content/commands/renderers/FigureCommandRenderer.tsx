import type {
    CommandRenderer,
} from "../CommandRenderer";

import InlineMarkdownRenderer
    from "../../../components/Markdown/InlineMarkdownRenderer";

import {
    getSourceHostname,
} from "../../sources/getSourceHostName";

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
            
            const sourceHostname =
                sourceUrl
                    ? getSourceHostname({
                        kind: "web",
                        url: sourceUrl,
                        siteName:
                            sourceSiteName ||
                            undefined,
                    })
                    : undefined;

            const sourceText =
                sourceHostname
                    ? sourceSiteName
                        ? `${sourceSiteName} (${sourceHostname})`
                        : sourceHostname
                    : undefined;

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
                    {imageUrl ? (
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
                        Figure {number}.{" "}
                        <InlineMarkdownRenderer
                            source={caption}
                        />
                    </figcaption>

                    {sourceUrl && sourceText && (
                        <div className="note-figure__source">
                            Source:{" "}
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {sourceText}
                            </a>
                        </div>
                    )}
                </figure>
            );
        },
    };

export default FigureCommandRenderer;