import type { DiagnosticResult } from "../models/Diagnostic";

import type { SourceTransformContext } from "./Transformer";

import {
    transformEquationNumbers,
} from "./transformEquationNumbers";

export function transformLatexSyntax(
    source: string,
    _filePath: string,
    context: SourceTransformContext,
): DiagnosticResult<string> {
    let transformedSource = source;

    transformedSource = transformEquationNumbers(
        transformedSource,
        context.numberedEquations,
    );

    transformedSource = transformDisplayDelimiters(
        transformedSource,
    );

    transformedSource = transformMathEnvironments(
        transformedSource,
    );

    return {
        value: transformedSource,
        diagnostics: [],
    };
}

function transformDisplayDelimiters(
    source: string,
): string {
    return source.replace(
        /\\\[([\s\S]*?)\\\]/g,
        (_match, content: string) => {
            return `\n\n$$\n${content.trim()}\n$$\n\n`;
        },
    );
}

const mathEnvironmentPattern =
    /\\begin\{(equation|align)(\*)?\}[\s\S]*?\\end\{\1\2\}/g;

function transformMathEnvironments(
    source: string,
): string {
    return source.replace(
        mathEnvironmentPattern,
        (environment) => {
            return (
                "\n\n$$\n" +
                environment +
                "\n$$\n\n"
            );
        },
    );
}