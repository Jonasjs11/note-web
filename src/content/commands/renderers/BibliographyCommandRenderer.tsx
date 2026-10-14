import type { CommandRenderer } from "../CommandRenderer";
import DocumentAnchorLink from "../../../components/DocumentAnchorLink";
import type { BibliographyEntry } from "../../citations/parseBibtex";
import { resolveCitationUrl } from "../../citations/citationUrl";

interface CitedEntry extends BibliographyEntry {
    citationNumber: number;
    anchorId: string;
    firstCitationId: string;
}

const BibliographyCommandRenderer: CommandRenderer = {
    render(args) {
        let parsed: unknown;
        try { parsed = JSON.parse(args[0] ?? "null"); } catch { parsed = null; }
        if (!Array.isArray(parsed)) {
            return <div className="command-error">Invalid bibliography</div>;
        }
        const entries = parsed.filter((value): value is CitedEntry =>
            value !== null && typeof value === "object" &&
            typeof value.citationNumber === "number" &&
            typeof value.key === "string" &&
            typeof value.anchorId === "string" &&
            typeof value.firstCitationId === "string",
        );
        if (entries.length === 0) return null;
        return (
            <section className="note-bibliography" aria-label="Litteraturliste">
                <h2>Litteraturliste</h2>
                <ol>
                    {entries.map((entry) => {
                        const link = entry.url ? resolveCitationUrl(entry.url) : undefined;
                        const doi = entry.doi && resolveCitationUrl(
                            /^https?:\/\//i.test(entry.doi)
                                ? entry.doi
                                : `https://doi.org/${entry.doi}`,
                        );
                        const author = entry.author || entry.organization;
                        const details = [
                            entry.organization && entry.organization !== author
                                ? entry.organization : undefined,
                            entry.journal || entry.booktitle || entry.publisher,
                            entry.edition ? `${entry.edition}. udgave` : undefined,
                            entry.volume ? `Vol. ${entry.volume}` : undefined,
                            entry.number ? `Nr. ${entry.number}` : undefined,
                            entry.pages ? `s. ${entry.pages}` : undefined,
                        ].filter(Boolean).join(", ");
                        return (
                            <li id={entry.anchorId} key={entry.key} value={entry.citationNumber}>
                                {author && <>{author}. </>}
                                <cite>{entry.title || entry.key}</cite>
                                {entry.year && <> ({entry.year})</>}
                                {details && <>. {details}</>}
                                {entry.note && <>. {entry.note}</>}
                                {link && <>{" "}<a href={link} target="_blank" rel="noopener noreferrer">Kilde <span aria-hidden="true">↗</span></a></>}
                                {doi && <>{" "}<a href={doi} target="_blank" rel="noopener noreferrer">DOI <span aria-hidden="true">↗</span></a></>}
                                {" "}<DocumentAnchorLink
                                    anchorId={entry.firstCitationId}
                                    className="note-bibliography__backlink"
                                    title="Tilbage til første citation"
                                    aria-label={`Tilbage til citation ${entry.citationNumber}`}
                                >↩</DocumentAnchorLink>
                            </li>
                        );
                    })}
                </ol>
            </section>
        );
    },
};

export default BibliographyCommandRenderer;
