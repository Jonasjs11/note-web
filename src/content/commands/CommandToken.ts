import type { ReferenceType } from "../references/ReferenceTarget";

export const TOKEN_START = "\uE000";
export const TOKEN_END = "\uE001";

export interface ConceptCommandData {
    id: string;
    alias?: string;
}

export interface CommandTokenData {
    command: string;
    arguments: string[];
}

export type DecodedCommandToken =
    CommandTokenData;
export function encodeCommandToken(
    command: string,
    arguments_: string[],
): string {
    const encodedArguments = arguments_.map(
        encodeURIComponent,
    );

    return (
        TOKEN_START +
        [command, ...encodedArguments].join("|") +
        TOKEN_END
    );
}

export function decodeCommandToken(
    token: string,
): DecodedCommandToken {
    const fields = token.split("|");
    return {
        command: fields[0],
        arguments: fields
            .slice(1)
            .map(decodeURIComponent),
    };
}

export function createConceptToken(
    data: ConceptCommandData,
): string {
    const arguments_ = [data.id];

    if (data.alias) {
        arguments_.push(data.alias);
    }

    return encodeCommandToken(
        "concept",
        arguments_,
    );
}

export interface ReferenceTokenTarget {
    type: ReferenceType;
    anchorId: string;
    displayText: string;
}
export interface ReferenceCommandData {
    capitalize: boolean;
    targets: ReferenceTokenTarget[];
}

export function createReferenceToken(
    data: ReferenceCommandData,
): string {
    const arguments_ = [
        data.capitalize ? "true" : "false",
        ...data.targets.flatMap((target) => [
            target.type,
            target.anchorId,
            target.displayText,
        ]),
    ];

    return encodeCommandToken(
        "reference",
        arguments_,
    );
}

export function createSectionAnchorToken(
    anchorId: string,
): string {
    return encodeCommandToken(
        "section-anchor",
        [anchorId],
    );
}

export function createSimulationToken(
    simulationId: string,
): string {
    return encodeCommandToken(
        "simulation",
        [simulationId],
    );
}

export interface CalculatorCommandData {
    source: string;
    precision: number;
    defaultFormat: "decimal" | "scientific";
    preview: boolean;
    defaultAngleMode: "radians" | "degrees";
    angleLocked: boolean;
}

export function createCalculatorToken(
    data: CalculatorCommandData,
): string {
    return encodeCommandToken(
        "calculator",
        [
            data.source,
            data.precision.toString(),
            data.defaultFormat,
            data.preview ? "true" : "false",
            data.defaultAngleMode,
            data.angleLocked ? "true" : "false",
        ],
    );
}

export interface FigureSubfigureCommandData {
    imageUrl?: string;
    imagePath: string;

    caption?: string;
    letter: string;
    anchorId: string;
    width?: string;
    imageWidth?: string;

    sourceUrl?: string;
    sourceSiteName?: string;
}

export interface FigureCommandData {
    imageUrl?: string;
    imagePath: string;

    caption?: string;
    number: string;
    anchorId: string;
    width?: string;

    sourceUrl?: string;
    sourceSiteName?: string;

    subfigures?: FigureSubfigureCommandData[];
    subfigureGap?: string;
    pdfview?: boolean;
    pdfHeight?: string;
}
export function createFigureToken(
    data: FigureCommandData,
): string {
    return encodeCommandToken(
        "figure",
        [
            data.imageUrl ?? "",
            data.imagePath,
            data.caption ?? "",
            data.number,
            data.anchorId,
            data.width ?? "",
            data.sourceUrl ?? "",
            data.sourceSiteName ?? "",
            JSON.stringify(
                data.subfigures ?? [],
            ),
            data.subfigureGap ?? "",
            data.pdfview ? "pdfview" : "",
            data.pdfHeight ?? "",
        ],
    );
}

export interface TableCommandData {
    markdown: string;
    caption?: string;

    number: string;
    anchorId: string;

    sourceUrl?: string;
    sourceSiteName?: string;
}
export function createTableToken(
    data: TableCommandData,
): string {
    return encodeCommandToken(
        "table",
        [
            data.markdown,
            data.caption ?? "",
            data.number,
            data.anchorId,
            data.sourceUrl ?? "",
            data.sourceSiteName ?? "",
        ],
    );
}
