import type {
    CommandRenderer,
} from "../CommandRenderer";

import InlineMarkdownRenderer
    from "../../../components/Markdown/InlineMarkdownRenderer";

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
                        <img
                            src={imageUrl}
                            alt={
                                caption ||
                                `Figure ${number}`
                            }
                            className="note-figure__image"
                            style={
                                width
                                    ? {
                                        width,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="note-figure__error">
                            Unable to find image
                            {imagePath
                                ? ` "${imagePath}"`
                                : "."}
                        </div>
                    )}

                    <figcaption>
                        Figure {number}.{" "}
                        <InlineMarkdownRenderer
                            source={caption}
                        />
                    </figcaption>
                </figure>
            );
        },
    };

export default FigureCommandRenderer;