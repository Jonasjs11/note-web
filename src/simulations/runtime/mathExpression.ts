export interface CompiledMathExpression {
    evaluate(value: number): number;
}

type MathEvaluator = (
    variableValue: number,
) => number;

type Token =
    | {
          type: "number";
          value: number;
          index: number;
      }
    | {
          type: "identifier";
          value: string;
          index: number;
      }
    | {
          type: "operator";
          value:
              | "+"
              | "-"
              | "*"
              | "/"
              | "^";
          index: number;
      }
    | {
          type:
              | "left-parenthesis"
              | "right-parenthesis"
              | "comma"
              | "end";
          index: number;
      };

interface FunctionDefinition {
    minimumArguments: number;
    maximumArguments: number;
    evaluate(arguments_: number[]): number;
}

const functions = new Map<
    string,
    FunctionDefinition
>([
    ["sin", unary(Math.sin)],
    ["cos", unary(Math.cos)],
    ["tan", unary(Math.tan)],
    ["asin", unary(Math.asin)],
    ["acos", unary(Math.acos)],
    ["atan", unary(Math.atan)],
    ["sinh", unary(Math.sinh)],
    ["cosh", unary(Math.cosh)],
    ["tanh", unary(Math.tanh)],
    ["sqrt", unary(Math.sqrt)],
    ["abs", unary(Math.abs)],
    ["exp", unary(Math.exp)],
    ["ln", unary(Math.log)],
    ["log", unary(Math.log10)],
    ["log10", unary(Math.log10)],
    ["floor", unary(Math.floor)],
    ["ceil", unary(Math.ceil)],
    ["round", unary(Math.round)],
    ["sign", unary(Math.sign)],
    ["min", variadic(Math.min)],
    ["max", variadic(Math.max)],
    [
        "pow",
        {
            minimumArguments: 2,
            maximumArguments: 2,
            evaluate(arguments_) {
                return Math.pow(
                    arguments_[0],
                    arguments_[1],
                );
            },
        },
    ],
]);

const constants = new Map<string, number>([
    ["pi", Math.PI],
    ["π", Math.PI],
    ["e", Math.E],
]);

export function compileMathExpression(
    source: string,
    variable: string,
): CompiledMathExpression {
    const trimmedSource = source.trim();

    if (!trimmedSource) {
        throw new Error(
            "Enter the right-hand side of the function.",
        );
    }

    if (!isIdentifier(variable)) {
        throw new Error(
            `Invalid independent variable "${variable}".`,
        );
    }

    const parser = new MathExpressionParser(
        tokenize(trimmedSource),
        variable,
    );

    const evaluator = parser.parse();

    return {
        evaluate(value) {
            return evaluator(value);
        },
    };
}

class MathExpressionParser {
    private currentIndex = 0;

    constructor(
        private readonly tokens: Token[],
        private readonly variable: string,
    ) {}

    parse(): MathEvaluator {
        const evaluator =
            this.parseAdditive();

        const token = this.current();

        if (token.type !== "end") {
            throw syntaxError(
                token,
                "Unexpected input",
            );
        }

        return evaluator;
    }

    private parseAdditive(): MathEvaluator {
        let left =
            this.parseMultiplicative();

        while (true) {
            const token = this.current();

            if (
                token.type !== "operator" ||
                (token.value !== "+" &&
                    token.value !== "-")
            ) {
                return left;
            }

            this.currentIndex++;
            const right =
                this.parseMultiplicative();
            const previousLeft = left;

            left = token.value === "+"
                ? (value) =>
                      previousLeft(value) +
                      right(value)
                : (value) =>
                      previousLeft(value) -
                      right(value);
        }
    }

    private parseMultiplicative(): MathEvaluator {
        let left = this.parseUnary();

        while (true) {
            const token = this.current();
            let operation:
                | "multiply"
                | "divide"
                | undefined;

            if (
                token.type === "operator" &&
                token.value === "*"
            ) {
                operation = "multiply";
                this.currentIndex++;
            } else if (
                token.type === "operator" &&
                token.value === "/"
            ) {
                operation = "divide";
                this.currentIndex++;
            } else if (
                canStartImplicitProduct(token)
            ) {
                operation = "multiply";
            }

            if (!operation) {
                return left;
            }

            const right = this.parseUnary();
            const previousLeft = left;

            left = operation === "multiply"
                ? (value) =>
                      previousLeft(value) *
                      right(value)
                : (value) =>
                      previousLeft(value) /
                      right(value);
        }
    }

    private parseUnary(): MathEvaluator {
        const token = this.current();

        if (
            token.type === "operator" &&
            (token.value === "+" ||
                token.value === "-")
        ) {
            this.currentIndex++;
            const evaluator =
                this.parseUnary();

            return token.value === "+"
                ? evaluator
                : (value) =>
                      -evaluator(value);
        }

        return this.parsePower();
    }

    private parsePower(): MathEvaluator {
        const base = this.parsePrimary();
        const token = this.current();

        if (
            token.type !== "operator" ||
            token.value !== "^"
        ) {
            return base;
        }

        this.currentIndex++;
        const exponent = this.parseUnary();

        return (value) =>
            Math.pow(
                base(value),
                exponent(value),
            );
    }

    private parsePrimary(): MathEvaluator {
        const token = this.current();

        if (token.type === "number") {
            this.currentIndex++;
            return () => token.value;
        }

        if (token.type === "identifier") {
            this.currentIndex++;

            const identifier = token.value;
            const normalizedIdentifier =
                identifier.toLowerCase();

            if (
                this.current().type ===
                "left-parenthesis"
            ) {
                return this.parseFunctionCall(
                    token,
                    normalizedIdentifier,
                );
            }

            if (identifier === this.variable) {
                return (value) => value;
            }

            const constant =
                constants.get(
                    normalizedIdentifier,
                );

            if (constant !== undefined) {
                return () => constant;
            }

            throw syntaxError(
                token,
                `Unknown name "${identifier}"`,
            );
        }

        if (
            token.type === "left-parenthesis"
        ) {
            this.currentIndex++;
            const evaluator =
                this.parseAdditive();
            const closingToken =
                this.current();

            if (
                closingToken.type !==
                "right-parenthesis"
            ) {
                throw syntaxError(
                    closingToken,
                    "Expected a closing parenthesis",
                );
            }

            this.currentIndex++;
            return evaluator;
        }

        throw syntaxError(
            token,
            "Expected a number, variable, function, or parenthesis",
        );
    }

    private parseFunctionCall(
        token: Extract<
            Token,
            { type: "identifier" }
        >,
        functionName: string,
    ): MathEvaluator {
        const definition =
            functions.get(functionName);

        if (!definition) {
            throw syntaxError(
                token,
                `Unknown function "${token.value}"`,
            );
        }

        this.currentIndex++;
        const arguments_: MathEvaluator[] = [];

        if (
            this.current().type !==
            "right-parenthesis"
        ) {
            while (true) {
                arguments_.push(
                    this.parseAdditive(),
                );

                if (
                    this.current().type !==
                    "comma"
                ) {
                    break;
                }

                this.currentIndex++;
            }
        }

        const closingToken = this.current();

        if (
            closingToken.type !==
            "right-parenthesis"
        ) {
            throw syntaxError(
                closingToken,
                "Expected a closing parenthesis",
            );
        }

        this.currentIndex++;

        if (
            arguments_.length <
                definition.minimumArguments ||
            arguments_.length >
                definition.maximumArguments
        ) {
            const expected =
                definition.minimumArguments ===
                definition.maximumArguments
                    ? definition.minimumArguments.toString()
                    : `${definition.minimumArguments}–${definition.maximumArguments}`;

            throw syntaxError(
                token,
                `Function "${token.value}" expects ${expected} argument(s)`,
            );
        }

        return (value) =>
            definition.evaluate(
                arguments_.map(
                    (argument) =>
                        argument(value),
                ),
            );
    }

    private current(): Token {
        return this.tokens[
            this.currentIndex
        ];
    }
}

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;

    while (index < source.length) {
        const character = source[index];

        if (/\s/.test(character)) {
            index++;
            continue;
        }

        if (
            /[0-9.]/.test(character)
        ) {
            const numberMatch =
                source.slice(index).match(
                    /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/,
                );

            if (!numberMatch) {
                throw new Error(
                    `Invalid number at character ${index + 1}.`,
                );
            }

            const value = Number(
                numberMatch[0],
            );

            if (!Number.isFinite(value)) {
                throw new Error(
                    `Invalid number at character ${index + 1}.`,
                );
            }

            tokens.push({
                type: "number",
                value,
                index,
            });

            index += numberMatch[0].length;
            continue;
        }

        if (
            isIdentifierStart(character)
        ) {
            let endIndex = index + 1;

            while (
                endIndex < source.length &&
                isIdentifierPart(
                    source[endIndex],
                )
            ) {
                endIndex++;
            }

            tokens.push({
                type: "identifier",
                value: source.slice(
                    index,
                    endIndex,
                ),
                index,
            });

            index = endIndex;
            continue;
        }

        if (
            character === "*" &&
            source[index + 1] === "*"
        ) {
            tokens.push({
                type: "operator",
                value: "^",
                index,
            });
            index += 2;
            continue;
        }

        if (
            character === "+" ||
            character === "-" ||
            character === "*" ||
            character === "/" ||
            character === "^"
        ) {
            tokens.push({
                type: "operator",
                value: character,
                index,
            });
            index++;
            continue;
        }

        if (character === "(") {
            tokens.push({
                type: "left-parenthesis",
                index,
            });
            index++;
            continue;
        }

        if (character === ")") {
            tokens.push({
                type: "right-parenthesis",
                index,
            });
            index++;
            continue;
        }

        if (character === ",") {
            tokens.push({
                type: "comma",
                index,
            });
            index++;
            continue;
        }

        throw new Error(
            `Unexpected character "${character}" at character ${index + 1}.`,
        );
    }

    tokens.push({
        type: "end",
        index: source.length,
    });

    return tokens;
}

function canStartImplicitProduct(
    token: Token,
): boolean {
    return (
        token.type === "number" ||
        token.type === "identifier" ||
        token.type === "left-parenthesis"
    );
}

function syntaxError(
    token: Token,
    message: string,
): Error {
    return new Error(
        `${message} at character ${token.index + 1}.`,
    );
}

function unary(
    evaluate: (value: number) => number,
): FunctionDefinition {
    return {
        minimumArguments: 1,
        maximumArguments: 1,
        evaluate(arguments_) {
            return evaluate(arguments_[0]);
        },
    };
}

function variadic(
    evaluate: (...values: number[]) => number,
): FunctionDefinition {
    return {
        minimumArguments: 1,
        maximumArguments: Number.POSITIVE_INFINITY,
        evaluate(arguments_) {
            return evaluate(...arguments_);
        },
    };
}

function isIdentifier(
    value: string,
): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(
        value,
    );
}

function isIdentifierStart(
    character: string,
): boolean {
    return /[A-Za-z_π]/.test(character);
}

function isIdentifierPart(
    character: string,
): boolean {
    return /[A-Za-z0-9_π]/.test(
        character,
    );
}
