import type {
    SourceReference,
} from "../sources/SourceReference";

export interface NumberedSubfigure {
    letter: string;

    caption?: string;
    label?: string;

    /* Width of the subfigure container. */
    width?: string;

    /* Width of the image inside the container. */
    imageWidth?: string;

    sourceReference?: SourceReference;

    /* The complete authored subfigure environment. */
    source: string;

    /* Absolute offsets inside the original note. */
    startOffset: number;
    endOffset: number;
}
