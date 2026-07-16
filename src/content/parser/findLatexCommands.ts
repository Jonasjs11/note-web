export interface LatexCommandMatch {
    command: string;
    value: string;

    startOffset: number;
    endOffset: number;

    valueStartOffset: number;
    valueEndOffset: number;
}

/**
 * Finds commands with one required brace argument:
 *
 *     \caption{Example}
 *     \label{fig:test}
 *     \source{https://example.com}
 *
 * Nested braces inside the argument are supported.
 *
 * Offsets are relative to the supplied source string.
 */
export function findLatexCommands(
    source: string,
    command: string,
): LatexCommandMatch[] {
    const matches: LatexCommandMatch[] = [];

    const commandPrefix =
        `\\${command}`;

    let searchIndex = 0;

    while (searchIndex < source.length) {
        const commandStart =
            source.indexOf(
                commandPrefix,
                searchIndex,
            );

        if (commandStart === -1) {
            break;
        }

        const afterCommand =
            commandStart +
            commandPrefix.length;

        /*
         * Avoid matching the beginning of a longer
         * command name.
         *
         * For example, searching for \source should
         * not match \sourceurl.
         */
        const nextCharacter =
            source[afterCommand];

        if (
            nextCharacter &&
            isCommandNameCharacter(
                nextCharacter,
            )
        ) {
            searchIndex = afterCommand;
            continue;
        }

        const openingBrace =
            skipWhitespace(
                source,
                afterCommand,
            );

        if (
            source[openingBrace] !== "{"
        ) {
            searchIndex = afterCommand;
            continue;
        }

        const closingBrace =
            findMatchingClosingBrace(
                source,
                openingBrace,
            );

        if (closingBrace === undefined) {
            /*
             * The command is malformed. Validation may
             * diagnose this separately later.
             */
            searchIndex = openingBrace + 1;
            continue;
        }

        const valueStartOffset =
            openingBrace + 1;

        const valueEndOffset =
            closingBrace;

        matches.push({
            command,

            value: source.slice(
                valueStartOffset,
                valueEndOffset,
            ),

            startOffset:
                commandStart,

            endOffset:
                closingBrace + 1,

            valueStartOffset,
            valueEndOffset,
        });

        searchIndex =
            closingBrace + 1;
    }

    return matches;
}

function findMatchingClosingBrace(
    source: string,
    openingBrace: number,
): number | undefined {
    let depth = 0;

    for (
        let index = openingBrace;
        index < source.length;
        index++
    ) {
        const character =
            source[index];

        if (
            character === "\\" &&
            index + 1 < source.length
        ) {
            /*
             * Skip escaped characters such as:
             *
             *     \{
             *     \}
             */
            index++;
            continue;
        }

        if (character === "{") {
            depth++;
            continue;
        }

        if (character !== "}") {
            continue;
        }

        depth--;

        if (depth === 0) {
            return index;
        }
    }

    return undefined;
}

function skipWhitespace(
    source: string,
    startIndex: number,
): number {
    let index = startIndex;

    while (
        index < source.length &&
        /\s/.test(source[index])
    ) {
        index++;
    }

    return index;
}

function isCommandNameCharacter(
    character: string,
): boolean {
    return /[A-Za-z@]/.test(character);
}