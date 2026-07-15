import type {
    ReferenceNumber,
} from "./ReferenceTarget";

export type NumberedEquationKind =
    | "equation"
    | "align-row";

export interface NumberedEquation {
    kind: NumberedEquationKind;
    number: ReferenceNumber;

    label?: string;

    /*
     * Position in the original note source.
     *
     * These offsets identify the exact numbered object
     * before source transformations begin.
     */
    sourceStart: number;
    sourceEnd: number;

    subequationGroup?: number;
}