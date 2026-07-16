import Markdown from "react-markdown";

import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";

import rehypeKatex from "rehype-katex";

import rehypeCommandTokens
    from "../../content/commands/rehypeCommandTokens";

import commandComponents
    from "./commandComponents";

interface RenderMarkdownOptions {
    source: string;
    className?: string;
    components?: Parameters<
        typeof Markdown
    >[0]["components"];
}

export function renderMarkdown({
    source,
    className,
    components,
}: RenderMarkdownOptions) {
    return (
        <Markdown
            className={className}
            remarkPlugins={[
                remarkMath,
                remarkGfm,
            ]}
            rehypePlugins={[
                rehypeCommandTokens,
                rehypeKatex,
            ]}
            components={components ??
                commandComponents}
        >
            {source}
        </Markdown>
    );
}