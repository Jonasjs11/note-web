import MarkdownView
    from "./MarkdownView";

interface InlineMarkdownRendererProps {
    source: string;
}

export default function InlineMarkdownRenderer({
    source,
}: InlineMarkdownRendererProps) {
    return (
        <MarkdownView
            source={source}
            rootElement="span"
            components={{
                p({ children }) {
                    return (
                        <>
                            {children}
                        </>
                    );
                },
            }}
        />
    );
}