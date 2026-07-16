import type {
    SectionHeadingLevel,
} from "../sections/MarkdownHeading";

export interface Section {
    /** Authored heading text after removing an explicit label. */
    title: string;

    /** Plain heading name used by \cref and navigation UI. */
    displayText: string;

    level: SectionHeadingLevel;

    /** Automatic sec:... label or the author's explicit override. */
    label: string;

    anchorId: string;
    explicitLabel: boolean;

    source: string;
    startOffset: number;
    endOffset: number;
}
