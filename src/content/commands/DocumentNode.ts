export interface TextNode {
    type: "text";
    text: string;
}

export interface CommandNode {
    type: "command";

    command: string;

    arguments: string[];
}

export type DocumentNode =
    | TextNode
    | CommandNode;