import {
    TOKEN_END,
    TOKEN_START,
} from "../commands/CommandToken";

/*
 * Command tokens use literal pipe characters as field separators.
 * Inside GFM tables those pipes would be interpreted as cell
 * boundaries. HTML entities are decoded back into pipes after the
 * Markdown table structure has already been parsed.
 */
export function escapeCommandTokenPipes(
    source: string,
): string {
    let result = "";
    let currentOffset = 0;

    while (currentOffset < source.length) {
        const tokenStart = source.indexOf(
            TOKEN_START,
            currentOffset,
        );

        if (tokenStart === -1) {
            result += source.slice(
                currentOffset,
            );
            break;
        }

        result += source.slice(
            currentOffset,
            tokenStart,
        );

        const tokenEnd = source.indexOf(
            TOKEN_END,
            tokenStart +
                TOKEN_START.length,
        );

        if (tokenEnd === -1) {
            result += source.slice(
                tokenStart,
            );
            break;
        }

        const completeToken = source.slice(
            tokenStart,
            tokenEnd + TOKEN_END.length,
        );

        result += completeToken.replaceAll(
            "|",
            "&#124;",
        );

        currentOffset =
            tokenEnd + TOKEN_END.length;
    }

    return result;
}
