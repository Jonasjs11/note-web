import type { CommandRenderer } from "../CommandRenderer";
import DocumentAnchorLink from "../../../components/DocumentAnchorLink";

/** No href is constructed from raw Markdown at render time. */
export const WebsiteCitationRenderer: CommandRenderer = {
    render(args) {
        const [url, name] = args;
        if (!url || !name) return <span className="command-error">Invalid website citation</span>;
        return (
            <a className="citation-link citation-link--website"
                href={url} target="_blank" rel="noopener noreferrer"
                title={url}
            >({name})</a>
        );
    },
};

export const BibliographyCitationRenderer: CommandRenderer = {
    render(args) {
        const [number, targetId, referenceId, title] = args;
        if (!number || !targetId || !referenceId) {
            return <span className="command-error">Invalid bibliography citation</span>;
        }
        return (
            <span id={referenceId} className="citation-reference">
                <DocumentAnchorLink anchorId={targetId}
                    className="citation-link citation-link--numbered"
                    title={title || `Source ${number}`}
                >[{number}]</DocumentAnchorLink>
            </span>
        );
    },
};
