export type SectionHeadingLevel =
    | 2
    | 3
    | 4
    | 5
    | 6;

export interface MarkdownHeading {
    level: SectionHeadingLevel;

    /** Complete source line, excluding its line ending. */
    source: string;

    /** Heading text after the opening # characters. */
    content: string;

    /** Whitespace before the opening # characters. */
    indentation: string;

    startOffset: number;
    contentStartOffset: number;
    endOffset: number;

    /** Original line ending, if the heading had one. */
    lineEnding: string;
}
