import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./MarkdownRenderer.css";

interface MarkdownRendererProps {
    source: string;
}

export default function MarkdownRenderer({
    source,
}: MarkdownRendererProps) {
    return (
        <article className="markdown">
            <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
            >
                {source}
            </Markdown>
        </article>
    );
}