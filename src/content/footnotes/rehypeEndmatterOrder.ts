/**
 * GFM always appends its footnotes section after the Markdown document. That
 * would place it BELOW a citation bibliography. Move both kinds of endmatter
 * into a predictable order: ordinary content, footnotes, bibliography.
 *
 * Run after rehypeCommandTokens: the bibliography token has then been turned
 * into a <command-token command="bibliography"> HAST node.
 */
interface HastRoot {
    type: "root";
    children: HastNode[];
}
interface HastElement {
    type: "element";
    tagName: string;
    properties: Record<string, unknown>;
    children: HastNode[];
}
interface HastText {
    type: "text";
    value: string;
}
type HastNode = HastRoot | HastElement | HastText;

export default function rehypeEndmatterOrder() {
    return function reorder(tree: HastRoot): void {
        const body: HastNode[] = [];
        const footnotes: HastNode[] = [];
        const bibliographies: HastNode[] = [];

        for (const child of tree.children) {
            if (isGfmFootnotes(child)) {
                footnotes.push(child);
            } else if (isBibliography(child)) {
                bibliographies.push(child);
            } else {
                body.push(child);
            }
        }

        tree.children = [...body, ...footnotes, ...bibliographies];
    };
}

function isGfmFootnotes(node: HastNode): node is HastElement {
    if (node.type !== "element" || node.tagName !== "section") return false;
    const attrs = node.properties;
    return attrs.dataFootnotes === true ||
        attrs["data-footnotes"] === true ||
        (Array.isArray(attrs.className) && attrs.className.includes("footnotes"));
}

function isBibliography(node: HastNode): node is HastElement {
    return node.type === "element" &&
        node.tagName === "command-token" &&
        node.properties.command === "bibliography";
}
