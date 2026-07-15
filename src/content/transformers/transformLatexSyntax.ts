import type { DiagnosticResult } from "../models/Diagnostic";

export function transformLatexMath(
    source: string,
    _filePath: string,
): DiagnosticResult<string> {
    let transformedSource = source;

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

function transformMathEnvironments(
    source: string,
): string {
    const environmentPattern =
        /\\begin\{(equation\*?|align\*?)\}([\s\S]*?)\\end\{\1\}/g;

    return source.replace(
        environmentPattern,
        (
            _match,
            environment: string,
            content: string,
        ) => {
            const latex =
                `\\begin{${environment}}\n` +
                `${content.trim()}\n` +
                `\\end{${environment}}`;

            return `\n\n$$\n${latex}\n$$\n\n`;
        },
    );
}