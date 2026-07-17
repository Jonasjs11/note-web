import {
    decodeCommandToken,
    TOKEN_END,
    TOKEN_START,
} from "./CommandToken";

import type {
    DocumentNode,
} from "./DocumentNode";

export function parseCommandTokens(
    source: string,
): DocumentNode[] {

    const nodes: DocumentNode[] = [];

    let current = 0;

    while (true) {

        const tokenStart =
            source.indexOf(
                TOKEN_START,
                current,
            );

        if (tokenStart === -1) {
            break;
        }

        if (tokenStart > current) {

            nodes.push({
                type: "text",
                text: source.slice(
                    current,
                    tokenStart,
                ),
            });

        }

        const tokenEnd =
            source.indexOf(
                TOKEN_END,
                tokenStart,
            );

        if (tokenEnd === -1) {

            nodes.push({
                type: "text",
                text: source.slice(
                    tokenStart,
                ),
            });

            return nodes;
        }

        const token =
            source.slice(
                tokenStart +
                    TOKEN_START.length,
                tokenEnd,
            );

        const decoded = decodeCommandToken(token);
        nodes.push({
            type: "command",
            command: decoded.command,
            arguments: decoded.arguments,
        });

        current =
            tokenEnd +
            TOKEN_END.length;
    }

    if (current < source.length) {

        nodes.push({
            type: "text",
            text: source.slice(current),
        });

    }

    return nodes;
}