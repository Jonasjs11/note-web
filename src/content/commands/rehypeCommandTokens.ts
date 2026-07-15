import { parseCommandTokens } from "./parseCommandTokens";

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

type HastNode =
    | HastRoot
    | HastElement
    | HastText;

export default function rehypeCommandTokens() {
    return function transform(tree: HastRoot): void {
        processChildren(tree);
    };
}

function processChildren(
    parent: HastRoot | HastElement,
): void {
    /*
     * Commands inside code examples must remain literal text.
     */
    if (
        parent.type === "element" &&
        (parent.tagName === "code" ||
            parent.tagName === "pre")
    ) {
        return;
    }

    const processedChildren: HastNode[] = [];

    for (const child of parent.children) {
        if (child.type === "text") {
            processedChildren.push(
                ...convertTextNode(child),
            );

            continue;
        }

        if (
            child.type === "root" ||
            child.type === "element"
        ) {
            processChildren(child);
        }

        processedChildren.push(child);
    }

    parent.children = processedChildren;
}

function convertTextNode(
    textNode: HastText,
): HastNode[] {
    const documentNodes = parseCommandTokens(
        textNode.value,
    );

    return documentNodes.map((node) => {
        if (node.type === "text") {
            return {
                type: "text",
                value: node.text,
            };
        }

        return {
            type: "element",
            tagName: "command-token",
            properties: {
                command: node.command,
                arguments: JSON.stringify(
                    node.arguments,
                ),
            },
            children: [],
        };
    });
}