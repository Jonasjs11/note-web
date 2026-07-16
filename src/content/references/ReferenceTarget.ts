export type ReferenceType =
    | "equation"
    | "figure"
    | "table"
    | "section";

export interface ReferenceNumber {
    primary: number;
    sub?: string;
}

export interface ReferenceTarget {
    label: string;
    type: ReferenceType;

    /**
     * Numbered targets use number. Unnumbered semantic targets, such
     * as sections, use displayText instead.
     */
    number?: ReferenceNumber;
    displayText?: string;

    anchorId: string;

    parentLabel?: string;
    childLabels?: string[];
}
