import { useState } from "react";
import { useUiTranslation } from "../../i18n/useUiTranslation";
import "./FigurePdfViewer.css";

interface FigurePdfViewerProps { url: string; width?: string; height?: string; title: string; }
/** Native PDF embedding; some remote hosts block iframes. */
export default function FigurePdfViewer({ url, width = "100%", height = "75vh", title }: FigurePdfViewerProps) {
    const [expanded, setExpanded] = useState(false);
    const t = useUiTranslation();
    const safeUrl = (() => {
        try {
            const parsed = new URL(url, window.location.href);
            return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null;
        } catch { return null; }
    })();
    if (!safeUrl) return <div className="note-figure__error">{t("pdf.invalidUrl")}</div>;
    return (
        <div className={`note-pdf-viewer${expanded ? " note-pdf-viewer--expanded" : ""}`}
            style={expanded ? undefined : { width, height }}>
            <div className="note-pdf-viewer__toolbar">
                <span className="note-pdf-viewer__title">PDF · {title}</span>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">{t("pdf.open")} ↗</a>
                <a href={safeUrl} download>{t("common.download")}</a>
                <button type="button" onClick={() => setExpanded(value => !value)}>
                    {expanded ? t("pdf.closeFullscreen") : t("pdf.fullscreen")}
                </button>
            </div>
            <iframe className="note-pdf-viewer__frame" src={safeUrl} title={title}
                loading="lazy" referrerPolicy="no-referrer" />
            <div className="note-pdf-viewer__hint">{t("pdf.hint")}</div>
        </div>
    );
}
