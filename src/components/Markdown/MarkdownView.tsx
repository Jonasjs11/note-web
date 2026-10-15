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
import "./Citations.css";

import CommandTokenComponent
    from "./CommandTokenComponent";

import rehypeCommandTokens
    from "../../content/commands/rehypeCommandTokens";

import rehypeEndmatterOrder from "../../content/footnotes/rehypeEndmatterOrder";

import { useUiTranslation } from "../../i18n/useUiTranslation";

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

/**
 * Footnotes use GFM anchors; numbered bibliography citations use React Router
 * links. Both must scroll *within this MarkdownView*, not navigate the hash
 * router. Never use document.getElementById here: concept previews and other
 * MarkdownViews can repeat the same GFM IDs elsewhere on the page.
 */
function getManagedTargetId(link: HTMLAnchorElement): string | null {
    const href = link.getAttribute("href");
    if (!href) return null;

    const hashIndex = href.lastIndexOf("#");
    if (hashIndex < 0 || hashIndex === href.length - 1) return null;

    let id: string;
    try {
        id = decodeURIComponent(href.slice(hashIndex + 1));
    } catch {
        return null;
    }

    const isFootnote =
        link.hasAttribute("data-footnote-ref") ||
        link.hasAttribute("data-footnote-backref") ||
        /^#user-content-fn(?:ref)?-/.test(href);

    if (isFootnote && /^user-content-fn(?:ref)?-/.test(id)) {
        return id;
    }

    const isBibliographyLink = link.matches(
        ".citation-link--numbered, .note-bibliography__backlink",
    );
    if (isBibliographyLink && /^(?:bibliography-|citation-ref-)/.test(id)) {
        return id;
    }

    return null;
}

function getManagedLink(
    target: EventTarget | null,
    root: HTMLElement | null,
): HTMLAnchorElement | null {
    if (!(target instanceof Element) || !root) return null;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    return link && root.contains(link) && getManagedTargetId(link)
        ? link : null;
}

function getFootnoteLink(
    target: EventTarget | null,
    root: HTMLElement | null,
): HTMLAnchorElement | null {
    const link = getManagedLink(target, root);
    const id = link ? getManagedTargetId(link) : null;
    return id?.startsWith("user-content-fn") ? link : null;
}

function getLocalTarget(
    link: HTMLAnchorElement,
    root: HTMLElement,
): HTMLElement | null {
    const id = getManagedTargetId(link);
    if (!id) return null;
    if (root.id === id) return root;

    // Query IDs within the current rendered note. A global lookup can find
    // an identically named ID in a tooltip or another MarkdownView first.
    for (const node of Array.from(root.querySelectorAll<HTMLElement>("[id]"))) {
        if (node.id === id) return node;
    }
    return null;
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

    const t = useUiTranslation();

    function setRootRef(element: HTMLElement | null): void {
        rootRef.current = element;
    }

    // Handle clicks in the *capture phase*. The bibliography uses React
    // Router's Link component, whose own click handler runs before a bubbling
    // handler on Root. Capture lets us prevent routing before Link navigates.
    function handleClick(event: ReactMouseEvent<HTMLElement>): void {
        const root = rootRef.current;
        const link = getManagedLink(event.target, root);
        if (!root || !link) return;

        // Never allow a native #fragment to overwrite the hash-router URL.
        event.preventDefault();
        setPreview(null);

        const destination = getLocalTarget(link, root);
        if (!destination) {
            console.warn(
                "In-note citation/footnote target not found:",
                getManagedTargetId(link),
            );
            return;
        }
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
        const target = getLocalTarget(link, root);
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
            onClickCapture={handleClick}
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
                rehypePlugins={[rehypeCommandTokens, rehypeEndmatterOrder, rehypeMathjax]}
                components={mergedComponents}
                remarkRehypeOptions={{
                    footnoteLabel: t("footnotes.title"),
                    footnoteBackLabel: t("footnotes.return"),
                }}
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
