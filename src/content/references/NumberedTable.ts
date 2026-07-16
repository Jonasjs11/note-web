import type {
    SourceReference,
} from "../sources/SourceReference";

export interface NumberedTable {
    number: number;

    caption?: string;
    label?: string;
    sourceReference?: SourceReference;

    /*
     * The authored Markdown table, without the surrounding
     * table environment or metadata commands.
     */
    markdown: string;

    /*
     * The complete authored table environment.
     */
    source: string;

    /*
     * Absolute offsets inside the original note.
     */
    startOffset: number;
    endOffset: number;
}
