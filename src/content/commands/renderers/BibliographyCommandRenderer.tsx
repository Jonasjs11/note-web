import type { CommandRenderer } from "../CommandRenderer";
import DocumentAnchorLink from "../../../components/DocumentAnchorLink";
import type { BibliographyEntry } from "../../citations/parseBibtex";
import { resolveCitationUrl } from "../../citations/citationUrl";
import { useUiTranslation } from "../../../i18n/useUiTranslation";

interface CitedEntry extends BibliographyEntry {
    citationNumber: number;
    anchorId: string;
    firstCitationId: string;
}
const BibliographyCommandRenderer: CommandRenderer = {
    render(args) {
        let parsed: unknown;
        try { parsed = JSON.parse(args[0] ?? "null"); } catch { parsed = null; }
        if (!Array.isArray(parsed)) return <BibliographyError />;
        const entries = parsed.filter((value): value is CitedEntry =>
            value !== null && typeof value === "object" &&
            typeof value.citationNumber === "number" &&
            typeof value.key === "string" &&
            typeof value.anchorId === "string" &&
            typeof value.firstCitationId === "string",
        );
        return entries.length ? <BibliographyContents entries={entries} /> : null;
    },
};
function BibliographyError() {
    const t = useUiTranslation();
    return <div className="command-error">{t("bibliography.invalid")}</div>;
}
function BibliographyContents({ entries }: { entries: CitedEntry[] }) {
    const t = useUiTranslation();
    return (
        <section className="note-bibliography" aria-label={t("bibliography.title")}>
            <h2>{t("bibliography.title")}</h2>
            <ol>
                {entries.map(entry => {
                    const link = entry.url ? resolveCitationUrl(entry.url) : undefined;
                    const doi = entry.doi && resolveCitationUrl(
                        /^https?:\/\//i.test(entry.doi) ? entry.doi : `https://doi.org/${entry.doi}`,
                    );
                    const author = entry.author || entry.organization;
                    const details = [
                        entry.organization && entry.organization !== author ? entry.organization : undefined,
                        entry.journal || entry.booktitle || entry.publisher,
                        entry.edition ? t("bibliography.edition", { value: entry.edition }) : undefined,
                        entry.volume ? t("bibliography.volume", { value: entry.volume }) : undefined,
                        entry.number ? t("bibliography.number", { value: entry.number }) : undefined,
                        entry.pages ? t("bibliography.pages", { value: entry.pages }) : undefined,
                    ].filter(Boolean).join(", ");
                    return (
                        <li id={entry.anchorId} key={entry.key} value={entry.citationNumber}>
                            {author && <>{author}. </>}
                            <cite>{entry.title || entry.key}</cite>
                            {entry.year && <> ({entry.year})</>}
                            {details && <>. {details}</>}
                            {entry.note && <>. {entry.note}</>}
                            {link && <> {" "}<a href={link} target="_blank" rel="noopener noreferrer">
                                {t("common.source")} <span aria-hidden="true">↗</span>
                            </a></>}
                            {doi && <> {" "}<a href={doi} target="_blank" rel="noopener noreferrer">
                                DOI <span aria-hidden="true">↗</span>
                            </a></>}
                            {" "}<DocumentAnchorLink anchorId={entry.firstCitationId}
                                className="note-bibliography__backlink"
                                title={t("bibliography.backTitle")}
                                aria-label={t("bibliography.backTo", { number: entry.citationNumber })}>
                                ↩
                            </DocumentAnchorLink>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
export default BibliographyCommandRenderer;
