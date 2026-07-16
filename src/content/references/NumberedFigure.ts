export interface NumberedFigure {
    number: number;

    caption?: string;
    label?: string;
    width?: string;

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