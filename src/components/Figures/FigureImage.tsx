import { useState } from "react";
import { useUiTranslation } from "../../i18n/useUiTranslation";

interface FigureImageProps {
    imageUrl: string;
    imagePath: string;
    caption?: string;
    number: string;
    width?: string;
}
export default function FigureImage({ imageUrl, imagePath, caption, number, width }: FigureImageProps) {
    const [failed, setFailed] = useState(false);
    const t = useUiTranslation();
    if (failed) return (
        <div className="note-figure__error">
            {t("figure.loadFailed", { path: imagePath ? `"${imagePath}"` : "" })}
        </div>
    );
    return (
        <img src={imageUrl} alt={caption || t("figure.alt", { number })}
            className="note-figure__image" style={width ? { width } : undefined}
            loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onError={() => setFailed(true)} />
    );
}
