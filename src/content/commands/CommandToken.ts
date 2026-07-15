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
    number: string;
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
            target.number,
        ]),
    ];

    return encodeCommandToken(
        "reference",
        arguments_,
    );
}