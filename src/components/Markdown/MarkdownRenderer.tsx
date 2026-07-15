import {
    useLayoutEffect,
    useRef,
} from "react";

import rehypeMathjax from "rehype-mathjax/browser";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import "./MarkdownRenderer.css";

interface MarkdownRendererProps {
    source: string;
}

export default function MarkdownRenderer({
    source,
}: MarkdownRendererProps) {
    const articleRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        const article = articleRef.current;
        const mathJax = window.MathJax;

        if (!article || !mathJax) {
            return;
        }

        let cancelled = false;

        async function renderMath() {
            try {
                await mathJax.startup?.promise;

                if (cancelled) {
                    return;
                }

                mathJax.texReset?.(0);

                await mathJax.typesetPromise?.([
                    article,
                ]);
            } catch (error: unknown) {
                if (!cancelled) {
                    console.error(
                        "MathJax failed to render the note.",
                        error,
                    );
                }
            }
        }

        void renderMath();

        return () => {
            cancelled = true;

            mathJax.typesetClear?.([
                article,
            ]);
        };
    }, [source]);

    return (
        <article
            ref={articleRef}
            className="markdown"
        >
            <Markdown
                remarkPlugins={[
                    remarkGfm,
                    remarkMath,
                ]}
                rehypePlugins={[
                    rehypeMathjax,
                ]}
                skipHtml
            >
                {source}
            </Markdown>
        </article>
    );
}