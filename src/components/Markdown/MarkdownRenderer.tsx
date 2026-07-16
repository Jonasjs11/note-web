import MarkdownView
    from "./MarkdownView";

interface MarkdownRendererProps {
    source: string;
}

export default function MarkdownRenderer({
    source,
}: MarkdownRendererProps) {
    return (
        <MarkdownView
            source={source}
            className="markdown"
            rootElement="article"
        />
    );
}