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

    number: ReferenceNumber;
    anchorId: string;

    parentLabel?: string;
    childLabels?: string[];
}