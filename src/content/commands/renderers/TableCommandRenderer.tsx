import type { CommandRenderer } from "../CommandRenderer";
import MarkdownView from "../../../components/Markdown/MarkdownView";
import InlineMarkdownRenderer from "../../../components/Markdown/InlineMarkdownRenderer";
import { getSourceHostname } from "../../sources/getSourceHostName";
import { useUiTranslation } from "../../../i18n/useUiTranslation";

interface TableContentsProps {
    markdown: string;
    caption?: string;
    number: string;
    anchorId: string;
    sourceUrl?: string;
    sourceSiteName?: string;
}
const TableCommandRenderer: CommandRenderer = {
    render(arguments_) {
        const [markdown, caption, number, anchorId, sourceUrl, sourceSiteName] = arguments_;
        if (!number || !anchorId || !markdown) return <InvalidTable />;
        return <TableContents markdown={markdown} caption={caption} number={number}
            anchorId={anchorId} sourceUrl={sourceUrl} sourceSiteName={sourceSiteName} />;
    },
};
function InvalidTable() {
    const t = useUiTranslation();
    return <div className="command-error">{t("table.invalid")}</div>;
}
function TableContents({ markdown, caption, number, anchorId, sourceUrl, sourceSiteName }: TableContentsProps) {
    const t = useUiTranslation();
    const sourceHostname = sourceUrl ? getSourceHostname({
        kind: "web", url: sourceUrl, siteName: sourceSiteName || undefined,
    }) : undefined;
    const sourceText = sourceSiteName ? `${sourceSiteName} (${sourceHostname})` : sourceHostname;
    return (
        <figure id={anchorId} className="note-table">
            <div className="note-table__scroll">
                <MarkdownView source={markdown} rootElement="div" className="note-table__markdown" />
            </div>
            <figcaption className="note-table__caption">
                <span className="note-table__number">{t("table.label", { number })}</span>
                {caption && <> <InlineMarkdownRenderer source={caption} /></>}
            </figcaption>
            {sourceUrl && (
                <div className="note-table__source">
                    {t("common.source")}: {" "}
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceText}</a>
                </div>
            )}
        </figure>
    );
}
export default TableCommandRenderer;
