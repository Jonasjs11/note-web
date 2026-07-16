import type {
    SourceReference,
} from "../sources/SourceReference";

import type {
    NumberedSubfigure,
} from "./NumberedSubfigure";

export interface NumberedFigure {
    number: number;

    caption?: string;
    label?: string;
    width?: string;

    subfigureGap?: string;

    sourceReference?: SourceReference;

    subfigures: NumberedSubfigure[];

    /*
     * The complete authored figure environment.
     */
    source: string;

    /*
     * Absolute offsets inside the original note.
     */
    startOffset: number;
    endOffset: number;
}
