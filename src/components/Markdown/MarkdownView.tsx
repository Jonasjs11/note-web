import {
    useLayoutEffect,
    useRef,
} from "react";

import type { ElementType } from "react";

import rehypeMathjax from "rehype-mathjax/browser";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import type {
    Components,
} from "react-markdown";

import "./MarkdownRenderer.css";

import CommandTokenComponent
    from "./CommandTokenComponent";

import rehypeCommandTokens
    from "../../content/commands/rehypeCommandTokens";

const markdownComponents = {
    "command-token":
        CommandTokenComponent,
} as unknown as Components;

interface MarkdownViewProps {
    source: string;

    className?: string;

    rootElement?:
        | "article"
        | "div"
        | "span";

    components?: Components;
}

const rootRef =
    useRef<HTMLElement | null>(null);

function setRootRef(
    element: HTMLElement | null,
): void {
    rootRef.current = element;
}
export default function MarkdownView({
    source,
    className,
    rootElement = "article",
    components,
}: MarkdownViewProps) {
    const rootRef =
        useRef<HTMLElement>(null);

    /*
     * ElementType allows the chosen HTML tag to be
     * used as a JSX component.
     */
    const Root: ElementType =
        rootElement;

    const mergedComponents: Components = {
        ...markdownComponents,
        ...components,
    };

    useLayoutEffect(() => {
        const currentRoot =
            rootRef.current;

        const currentMathJax =
            window.MathJax;

        if (
            !currentRoot ||
            !currentMathJax
        ) {
            return;
        }

        /*
        * Stable aliases are used inside the asynchronous
        * function so TypeScript knows they cannot become
        * undefined or null.
        */
        const root = currentRoot;
        const mathJax = currentMathJax;

        let cancelled = false;

        async function renderMath(): Promise<void> {
            try {
                await mathJax.startup?.promise;

                if (cancelled) {
                    return;
                }

                mathJax.texReset?.(0);

                await mathJax.typesetPromise?.([
                    root,
                ]);
            } catch (error: unknown) {
                if (!cancelled) {
                    console.error(
                        "MathJax failed to render the document.",
                        error,
                    );
                }
            }
        }

        void renderMath();

        return () => {
            cancelled = true;

            mathJax.typesetClear?.([
                root,
            ]);
        };
    }, [
        source,
    ]);

    return (
        <Root
            ref={setRootRef}
            className={className}
        >
            <Markdown
                remarkPlugins={[
                    remarkGfm,
                    remarkMath,
                ]}
                rehypePlugins={[
                    rehypeCommandTokens,
                    rehypeMathjax,
                ]}
                components={
                    mergedComponents
                }
                skipHtml
            >
                {source}
            </Markdown>
        </Root>
    );
}