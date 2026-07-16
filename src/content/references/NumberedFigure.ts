import type {
    SourceReference,
} from "../sources/SourceReference";

export interface NumberedFigure {
    number: number;

    caption?: string;
    label?: string;
    width?: string;

    sourceReference?: SourceReference;

    /*
     * The complete authored figure environment.
     * This will be useful when we render figures.
     */
    source: string;

    /*
     * Absolute offsets inside the original note.
     */
    startOffset: number;
    endOffset: number;
}