import type {
    CommandRenderer,
} from "../CommandRenderer";

import MarkdownView
    from "../../../components/Markdown/MarkdownView";

import InlineMarkdownRenderer
    from "../../../components/Markdown/InlineMarkdownRenderer";

import {
    getSourceHostname,
} from "../../sources/getSourceHostName";

const TableCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const markdown =
                arguments_[0];

            const caption =
                arguments_[1];

            const number =
                arguments_[2];

            const anchorId =
                arguments_[3];

            const sourceUrl =
                arguments_[4];

            const sourceSiteName =
                arguments_[5];

            if (
                !number ||
                !anchorId ||
                !markdown
            ) {
                return (
                    <div className="command-error">
                        Invalid table
                    </div>
                );
            }

            return (
                <figure
                    id={anchorId}
                    className="note-table"
                >
                    <div className="note-table__scroll">
                        <MarkdownView
                            source={markdown}
                            rootElement="div"
                            className="note-table__markdown"
                        />
                    </div>

                    <figcaption className="note-table__caption">
                        <span className="note-table__number">
                            Table {number}.
                        </span>

                        {caption && (
                            <>
                                {" "}
                                <InlineMarkdownRenderer
                                    source={caption}
                                />
                            </>
                        )}
                    </figcaption>

                    <TableSource
                        sourceUrl={sourceUrl}
                        sourceSiteName={
                            sourceSiteName
                        }
                    />
                </figure>
            );
        },
    };

interface TableSourceProps {
    sourceUrl?: string;
    sourceSiteName?: string;
}

function TableSource({
    sourceUrl,
    sourceSiteName,
}: TableSourceProps) {
    if (!sourceUrl) {
        return null;
    }

    const sourceHostname =
        getSourceHostname({
            kind: "web",
            url: sourceUrl,
            siteName:
                sourceSiteName ||
                undefined,
        });

    const sourceText = sourceSiteName
        ? `${sourceSiteName} (${sourceHostname})`
        : sourceHostname;

    return (
        <div className="note-table__source">
            Source:{" "}
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                {sourceText}
            </a>
        </div>
    );
}

export default TableCommandRenderer;
