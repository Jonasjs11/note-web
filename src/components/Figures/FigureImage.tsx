import {
    useState,
} from "react";

interface FigureImageProps {
    imageUrl: string;
    imagePath: string;
    caption?: string;
    number: string;
    width?: string;
}

export default function FigureImage({
    imageUrl,
    imagePath,
    caption,
    number,
    width,
}: FigureImageProps) {
    const [failed, setFailed] =
        useState(false);

    if (failed) {
        return (
            <div className="note-figure__error">
                Unable to load image
                {imagePath
                    ? ` "${imagePath}".`
                    : "."}
            </div>
        );
    }

    return (
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
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
                setFailed(true);
            }}
        />
    );
}