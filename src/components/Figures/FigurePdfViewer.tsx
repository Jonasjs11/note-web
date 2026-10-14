import { useState } from "react";
import "./FigurePdfViewer.css";

interface FigurePdfViewerProps {
    url: string;
    width?: string;
    height?: string;
    title: string;
}

/** Native PDF embedding: no PDF.js fetch and therefore no PDF.js CORS requirement.
 * A remote host can still prohibit embedding with X-Frame-Options or CSP.
 */
export default function FigurePdfViewer({
    url, width = "100%", height = "75vh", title,
}: FigurePdfViewerProps) {
    const [expanded, setExpanded] = useState(false);
    const safeUrl = (() => {
        try {
            const parsed = new URL(url, window.location.href);
            return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null;
        } catch {
            return null;
        }
    })();

    if (!safeUrl) {
        return <div className="note-figure__error">Invalid PDF URL.</div>;
    }

    return (
        <div
            className={`note-pdf-viewer${expanded ? " note-pdf-viewer--expanded" : ""}`}
            style={expanded ? undefined : { width, height }}
        >
            <div className="note-pdf-viewer__toolbar">
                <span className="note-pdf-viewer__title">PDF · {title}</span>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF ↗
                </a>
                <a href={safeUrl} download>Download</a>
                <button type="button" onClick={() => setExpanded((value) => !value)}>
                    {expanded ? "Close fullscreen" : "Fullscreen"}
                </button>
            </div>
            <iframe
                className="note-pdf-viewer__frame"
                src={safeUrl}
                title={title}
                loading="lazy"
                referrerPolicy="no-referrer"
            />
            <div className="note-pdf-viewer__hint">
                Use the PDF toolbar to zoom and change pages. If the PDF does not
                appear, select “Open PDF” (some hosts block embedding).
            </div>
        </div>
    );
}
