import {
    useLayoutEffect,
    useRef,
    useState,
} from "react";

import type {
    ElementType,
    MouseEvent as ReactMouseEvent,
    FocusEvent as ReactFocusEvent,
    KeyboardEvent as ReactKeyboardEvent,
} from "react";

import rehypeMathjax from "rehype-mathjax/browser";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import type {
    Components,
} from "react-markdown";

import "./MarkdownRenderer.css";
import "./Footnotes.css";

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

interface FootnotePreview {
    text: string;
    x: number;
    y: number;
    placement: "above" | "below";
}

/** GFM uses #user-content-fn-ID for definitions, and
 * #user-content-fnref-ID for the links back to references. */
function isFootnoteHref(href: string | null): href is string {
    return href !== null &&
        /^#user-content-fn(?:ref)?-/.test(href);
}

function getFootnoteLink(
    target: EventTarget | null,
    root: HTMLElement | null,
): HTMLAnchorElement | null {
    if (!(target instanceof Element) || !root) {
        return null;
    }

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link || !root.contains(link) ||
        !isFootnoteHref(link.getAttribute("href"))) {
        return null;
    }
    return link;
}

function getFootnoteTarget(
    link: HTMLAnchorElement,
    root: HTMLElement,
): HTMLElement | null {
    const href = link.getAttribute("href");
    if (!isFootnoteHref(href)) {
        return null;
    }
    let id: string;
    try {
        id = decodeURIComponent(href.slice(1));
    } catch {
        return null;
    }
    const target = document.getElementById(id);
    return target && root.contains(target) ? target : null;
}

function getPreviewText(destination: HTMLElement): string {
    // Footnote definitions contain their text in <li id="user-content-fn-...">.
    // Clone the content so back-reference arrows are excluded from the preview.
    const copy = destination.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[data-footnote-backref]").forEach(
        (node) => node.remove(),
    );
    return (copy.innerText || copy.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
}

export default function MarkdownView({
    source,
    className,
    rootElement = "article",
    components,
}: MarkdownViewProps) {
    const rootRef = useRef<HTMLElement | null>(null);
    const [preview, setPreview] = useState<FootnotePreview | null>(null);

    function setRootRef(element: HTMLElement | null): void {
        rootRef.current = element;
    }

    // A native fragment link would replace the hash-router path.
    // Navigate by scrolling instead, preserving the current URL.
    function handleClick(event: ReactMouseEvent<HTMLElement>): void {
        const root = rootRef.current;
        const link = getFootnoteLink(event.target, root);
        if (!root || !link) return;
        const destination = getFootnoteTarget(link, root);
        if (!destination) return;

        event.preventDefault();
        setPreview(null);
        destination.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    function showPreview(link: HTMLAnchorElement): void {
        const root = rootRef.current;
        if (!root) return;
        const href = link.getAttribute("href");
        // Only show previews for references pointing *to* a definition.
        // Back-reference arrows should just be clickable.
        if (!href?.startsWith("#user-content-fn-")) return;
        const target = getFootnoteTarget(link, root);
        if (!target) return;
        const text = getPreviewText(target);
        if (!text) return;

        const rect = link.getBoundingClientRect();
        const placement = rect.top > 210 ? "above" : "below";
        setPreview({
            text,
            x: Math.max(
                Math.min(204, window.innerWidth / 2),
                Math.min(
                    window.innerWidth - Math.min(204, window.innerWidth / 2),
                    rect.left + rect.width / 2,
                ),
            ),
            y: placement === "above" ? rect.top - 10 : rect.bottom + 10,
            placement,
        });
    }

    function handleMouseOver(event: ReactMouseEvent<HTMLElement>): void {
        const link = getFootnoteLink(event.target, rootRef.current);
        if (link) showPreview(link);
    }

    function handleMouseOut(event: ReactMouseEvent<HTMLElement>): void {
        const root = rootRef.current;
        const from = getFootnoteLink(event.target, root);
        if (!from) return;
        const to = event.relatedTarget;
        if (to instanceof Node && from.contains(to)) return;
        setPreview(null);
    }

    function handleFocus(event: ReactFocusEvent<HTMLElement>): void {
        const link = getFootnoteLink(event.target, rootRef.current);
        if (link) showPreview(link);
    }

    function handleBlur(event: ReactFocusEvent<HTMLElement>): void {
        const link = getFootnoteLink(event.target, rootRef.current);
        if (link) setPreview(null);
    }

    const Root: ElementType = rootElement;
    const mergedComponents: Components = {
        ...markdownComponents,
        ...components,
    };

    useLayoutEffect(() => {
        const currentRoot = rootRef.current;
        const currentMathJax = window.MathJax;

        if (!currentRoot || !currentMathJax) return;

        const root = currentRoot;
        const mathJax = currentMathJax;
        let cancelled = false;

        async function renderMath(): Promise<void> {
            try {
                await mathJax.startup?.promise;
                if (cancelled) return;
                mathJax.texReset?.(0);
                await mathJax.typesetPromise?.([root]);
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
            mathJax.typesetClear?.([root]);
        };
    }, [source]);

    return (
        <Root
            ref={setRootRef}
            className={className}
            onClick={handleClick}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onFocusCapture={handleFocus}
            onBlurCapture={handleBlur}
            onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => {
                if (event.key === "Escape") setPreview(null);
            }}
        >
            <Markdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeCommandTokens, rehypeMathjax]}
                components={mergedComponents}
                skipHtml
            >
                {source}
            </Markdown>
            {preview && (
                <span
                    className={`footnote-preview footnote-preview--${preview.placement}`}
                    role="tooltip"
                    style={{ left: preview.x, top: preview.y }}
                >
                    {preview.text}
                </span>
            )}
        </Root>
    );
}
