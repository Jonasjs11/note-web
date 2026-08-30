export type CalculatorExpressionNode =
    | {
          type: "number";
          value: number;
          source: string;
      }
    | {
          type: "variable";
          name: string;
      }
    | {
          type: "constant";
          name: "pi" | "e";
      }
    | {
          type: "unary";
          operator: "+" | "-";
          operand: CalculatorExpressionNode;
      }
    | {
          type: "binary";
          operator: "+" | "-" | "*" | "/" | "^";
          left: CalculatorExpressionNode;
          right: CalculatorExpressionNode;
      }
    | {
          type: "function";
          name: string;
          arguments: CalculatorExpressionNode[];
      };

export interface CalculatorDefinition {
    outputLabel: string;
    expression: CalculatorExpressionNode;
    variables: string[];
}

export type CalculatorEvaluationResult =
    | {
          status: "success";
          value: number;
      }
    | {
          status: "incomplete";
          message?: string;
      }
    | {
          status: "undefined";
          message: string;
      }
    | {
          status: "error";
          message: string;
      };

export type CalculatorAngleMode = "radians" | "degrees";

export type NumericInputResult =
    | {
          status: "valid";
          value: number;
      }
    | {
          status: "incomplete";
      }
    | {
          status: "invalid";
          message: string;
      };

type Token =
    | {
          type: "number";
          value: number;
          source: string;
          index: number;
      }
    | {
          type: "variable";
          value: string;
          index: number;
      }
    | {
          type: "identifier";
          value: string;
          index: number;
      }
    | {
          type: "operator";
          value: "+" | "-" | "*" | "/" | "^";
          index: number;
      }
    | {
          type:
              | "left-parenthesis"
              | "right-parenthesis"
              | "left-brace"
              | "right-brace"
              | "comma"
              | "end";
          index: number;
      };

interface FunctionDefinition {
    minimumArguments: number;
    maximumArguments: number;
    evaluate(arguments_: number[]): number;
    validate?(arguments_: number[]): string | undefined;
}

const functions = new Map<string, FunctionDefinition>([
    ["sin", unary(Math.sin)],
    ["cos", unary(Math.cos)],
    ["tan", unary(Math.tan)],
    ["asin", unary(Math.asin, unitIntervalDomain("asin"))],
    ["acos", unary(Math.acos, unitIntervalDomain("acos"))],
    ["atan", unary(Math.atan)],
    ["sinh", unary(Math.sinh)],
    ["cosh", unary(Math.cosh)],
    ["tanh", unary(Math.tanh)],
    [
        "sqrt",
        unary(Math.sqrt, (value) =>
            value < 0
                ? "Square root of a negative number is not real."
                : undefined,
        ),
    ],
    ["abs", unary(Math.abs)],
    ["exp", unary(Math.exp)],
    [
        "ln",
        unary(Math.log, (value) =>
            value <= 0
                ? "ln is only defined for positive real numbers."
                : undefined,
        ),
    ],
    [
        "log",
        unary(Math.log10, (value) =>
            value <= 0
                ? "log is only defined for positive real numbers."
                : undefined,
        ),
    ],
    [
        "log10",
        unary(Math.log10, (value) =>
            value <= 0
                ? "log10 is only defined for positive real numbers."
                : undefined,
        ),
    ],
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
                return Math.pow(arguments_[0], arguments_[1]);
            },
        },
    ],
]);

const constantValues = new Map<string, number>([
    ["pi", Math.PI],
    ["π", Math.PI],
    ["e", Math.E],
]);

const functionLatexNames = new Set([
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "sinh",
    "cosh",
    "tanh",
    "ln",
    "log",
    "log10",
]);

const degreeInputFunctions = new Set([
    "sin",
    "cos",
    "tan",
]);

const degreeOutputFunctions = new Set([
    "asin",
    "acos",
    "atan",
]);

export function parseCalculatorDefinition(
    source: string,
): CalculatorDefinition {
    const trimmedSource = source.trim();

    if (!trimmedSource) {
        throw new Error("Calculator formula is empty.");
    }

    const withoutTrailingEquals = trimmedSource.replace(/=\s*$/, "").trim();
    const assignmentIndex = findTopLevelEquals(withoutTrailingEquals);

    if (assignmentIndex < 0) {
        throw new Error(
            'A predefined calculator must contain an assignment such as "F = [m][a]".',
        );
    }

    const outputLabel = withoutTrailingEquals
        .slice(0, assignmentIndex)
        .trim();
    const expressionSource = withoutTrailingEquals
        .slice(assignmentIndex + 1)
        .trim();

    if (!outputLabel) {
        throw new Error("Calculator output label is missing before =.");
    }
    if (!isDisplayLabel(outputLabel)) {
        throw new Error(
            `Invalid calculator output label "${outputLabel}". Use a simple symbol such as F, E, v_f, or \\theta.`,
        );
    }
    if (!expressionSource) {
        throw new Error("Calculator formula is missing after =.");
    }
    if (findTopLevelEquals(expressionSource) >= 0) {
        throw new Error("A calculator formula can contain only one top-level = sign.");
    }

    const expression = parseExpression(expressionSource, "author");
    const variables = collectVariables(expression);

    if (variables.length === 0) {
        throw new Error(
            "A predefined calculator needs at least one [variable] input.",
        );
    }

    return {
        outputLabel,
        expression,
        variables,
    };
}

export function parseFreeCalculatorExpression(
    source: string,
): CalculatorExpressionNode {
    const trimmedSource = source.trim();

    if (!trimmedSource) {
        throw new Error("Enter a calculation.");
    }

    return parseExpression(trimmedSource, "free");
}

export function parseNumericInput(source: string): NumericInputResult {
    const trimmed = source.trim();

    if (!trimmed) {
        return { status: "incomplete" };
    }

    if (
        /^[+-]?(?:\.?|(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?)$/.test(trimmed)
    ) {
        return { status: "incomplete" };
    }

    if (
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(
            trimmed,
        )
    ) {
        return {
            status: "invalid",
            message: `"${source}" is not a valid number. Scientific notation such as 6.02e23 is supported.`,
        };
    }

    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
        return {
            status: "invalid",
            message: "That number is outside the supported range.",
        };
    }

    return {
        status: "valid",
        value,
    };
}

export function evaluateCalculatorExpression(
    expression: CalculatorExpressionNode,
    values: Readonly<Record<string, number>> = {},
    angleMode: CalculatorAngleMode = "radians",
): CalculatorEvaluationResult {
    try {
        return evaluateNode(expression, values, angleMode);
    } catch (error: unknown) {
        return {
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "The calculation could not be evaluated.",
        };
    }
}

export function calculatorExpressionToLatex(
    expression: CalculatorExpressionNode,
): string {
    return toLatex(expression, 0);
}

export function displayLabelToLatex(label: string): string {
    const trimmed = label.trim();
    const underscoreIndex = trimmed.indexOf("_");
    const base = underscoreIndex >= 0
        ? trimmed.slice(0, underscoreIndex)
        : trimmed;
    const subscript = underscoreIndex >= 0
        ? trimmed.slice(underscoreIndex + 1)
        : "";

    const latexBase = base.startsWith("\\")
        ? base
        : greekLatexName(base) ?? escapeLatexIdentifier(base);

    if (!subscript) {
        return latexBase;
    }

    const latexSubscript = subscript.startsWith("\\")
        ? subscript
        : greekLatexName(subscript) ?? escapeLatexIdentifier(subscript);

    return `${latexBase}_{${latexSubscript}}`;
}

function parseExpression(
    source: string,
    mode: "author" | "free",
): CalculatorExpressionNode {
    const parser = new CalculatorExpressionParser(tokenize(source), mode);
    return parser.parse();
}

class CalculatorExpressionParser {
    private currentIndex = 0;
    private readonly tokens: Token[];
    private readonly mode: "author" | "free";

    constructor(tokens: Token[], mode: "author" | "free") {
        this.tokens = tokens;
        this.mode = mode;
    }

    parse(): CalculatorExpressionNode {
        const expression = this.parseAdditive();
        const token = this.current();

        if (token.type !== "end") {
            throw syntaxError(token, "Unexpected input");
        }

        return expression;
    }

    private parseAdditive(): CalculatorExpressionNode {
        let left = this.parseMultiplicative();

        while (true) {
            const token = this.current();
            if (
                token.type !== "operator" ||
                (token.value !== "+" && token.value !== "-")
            ) {
                return left;
            }

            this.currentIndex++;
            const right = this.parseMultiplicative();
            left = {
                type: "binary",
                operator: token.value,
                left,
                right,
            };
        }
    }

    private parseMultiplicative(): CalculatorExpressionNode {
        let left = this.parseUnary();

        while (true) {
            const token = this.current();
            let operator: "*" | "/" | undefined;

            if (token.type === "operator" && token.value === "*") {
                operator = "*";
                this.currentIndex++;
            } else if (token.type === "operator" && token.value === "/") {
                operator = "/";
                this.currentIndex++;
            } else if (canStartImplicitProduct(token)) {
                operator = "*";
            }

            if (!operator) {
                return left;
            }

            const right = this.parseUnary();
            left = {
                type: "binary",
                operator,
                left,
                right,
            };
        }
    }

    private parseUnary(): CalculatorExpressionNode {
        const token = this.current();

        if (
            token.type === "operator" &&
            (token.value === "+" || token.value === "-")
        ) {
            this.currentIndex++;
            return {
                type: "unary",
                operator: token.value,
                operand: this.parseUnary(),
            };
        }

        return this.parsePower();
    }

    private parsePower(): CalculatorExpressionNode {
        const base = this.parsePrimary();
        const token = this.current();

        if (token.type !== "operator" || token.value !== "^") {
            return base;
        }

        this.currentIndex++;
        return {
            type: "binary",
            operator: "^",
            left: base,
            right: this.parseUnary(),
        };
    }

    private parsePrimary(): CalculatorExpressionNode {
        const token = this.current();

        if (token.type === "number") {
            this.currentIndex++;
            return {
                type: "number",
                value: token.value,
                source: token.source,
            };
        }

        if (token.type === "variable") {
            if (this.mode !== "author") {
                throw syntaxError(
                    token,
                    "[variable] placeholders are only valid in predefined calculator formulas",
                );
            }

            this.currentIndex++;
            return {
                type: "variable",
                name: token.value,
            };
        }

        if (token.type === "identifier") {
            this.currentIndex++;
            const normalized = token.value.toLowerCase();

            if (normalized === "frac") {
                const numerator = this.parseRequiredGroup("fraction numerator");
                const denominator = this.parseRequiredGroup("fraction denominator");
                return {
                    type: "binary",
                    operator: "/",
                    left: numerator,
                    right: denominator,
                };
            }

            const constant = constantValues.get(normalized);
            if (constant !== undefined) {
                return {
                    type: "constant",
                    name: normalized === "e" ? "e" : "pi",
                };
            }

            if (this.isGroupStart(this.current())) {
                return this.parseFunctionCall(token, normalized);
            }

            if (functions.has(normalized)) {
                throw syntaxError(
                    token,
                    `Function "${token.value}" needs parentheses or braces, for example ${token.value}(2)`,
                );
            }

            if (this.mode === "author") {
                throw syntaxError(
                    token,
                    `Unknown name "${token.value}". Put user inputs in square brackets, for example [${token.value}]`,
                );
            }

            throw syntaxError(token, `Unknown name "${token.value}"`);
        }

        if (this.isGroupStart(token)) {
            return this.parseGroup();
        }

        throw syntaxError(
            token,
            this.mode === "author"
                ? "Expected a number, [variable], constant, function, or group"
                : "Expected a number, constant, function, or parenthesis",
        );
    }

    private parseFunctionCall(
        token: Extract<Token, { type: "identifier" }>,
        functionName: string,
    ): CalculatorExpressionNode {
        const definition = functions.get(functionName);
        if (!definition) {
            throw syntaxError(token, `Unknown function "${token.value}"`);
        }

        const startToken = this.current();
        const endType = matchingGroupEnd(startToken);
        if (!endType) {
            throw syntaxError(startToken, "Expected a function argument group");
        }

        this.currentIndex++;
        const arguments_: CalculatorExpressionNode[] = [];

        if (this.current().type !== endType) {
            while (true) {
                arguments_.push(this.parseAdditive());
                if (this.current().type !== "comma") {
                    break;
                }
                this.currentIndex++;
            }
        }

        const closingToken = this.current();
        if (closingToken.type !== endType) {
            throw syntaxError(closingToken, "Expected a closing parenthesis or brace");
        }
        this.currentIndex++;

        if (
            arguments_.length < definition.minimumArguments ||
            arguments_.length > definition.maximumArguments
        ) {
            const expected =
                definition.minimumArguments === definition.maximumArguments
                    ? definition.minimumArguments.toString()
                    : `${definition.minimumArguments}–${definition.maximumArguments}`;
            throw syntaxError(
                token,
                `Function "${token.value}" expects ${expected} argument(s)`,
            );
        }

        return {
            type: "function",
            name: functionName,
            arguments: arguments_,
        };
    }

    private parseRequiredGroup(description: string): CalculatorExpressionNode {
        const token = this.current();
        if (!this.isGroupStart(token)) {
            throw syntaxError(token, `Expected ${description} in braces or parentheses`);
        }
        return this.parseGroup();
    }

    private parseGroup(): CalculatorExpressionNode {
        const openingToken = this.current();
        const endType = matchingGroupEnd(openingToken);
        if (!endType) {
            throw syntaxError(openingToken, "Expected an opening parenthesis or brace");
        }

        this.currentIndex++;
        const expression = this.parseAdditive();
        const closingToken = this.current();

        if (closingToken.type !== endType) {
            throw syntaxError(closingToken, "Expected a closing parenthesis or brace");
        }

        this.currentIndex++;
        return expression;
    }

    private isGroupStart(token: Token): boolean {
        return token.type === "left-parenthesis" || token.type === "left-brace";
    }

    private current(): Token {
        return this.tokens[this.currentIndex];
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

        if (character === "−" || character === "–") {
            tokens.push({ type: "operator", value: "-", index });
            index++;
            continue;
        }
        if (character === "×" || character === "·" || character === "⋅") {
            tokens.push({ type: "operator", value: "*", index });
            index++;
            continue;
        }
        if (character === "÷") {
            tokens.push({ type: "operator", value: "/", index });
            index++;
            continue;
        }
        if (character === "√") {
            tokens.push({ type: "identifier", value: "sqrt", index });
            index++;
            continue;
        }

        if (character === "[") {
            const closingIndex = source.indexOf("]", index + 1);
            if (closingIndex < 0) {
                throw new Error(`Unclosed [variable] starting at character ${index + 1}.`);
            }

            const value = source.slice(index + 1, closingIndex).trim();
            if (!value || !isDisplayLabel(value)) {
                throw new Error(
                    `Invalid calculator variable at character ${index + 1}. Use labels such as [m], [v_f], or [\\theta].`,
                );
            }

            tokens.push({
                type: "variable",
                value,
                index,
            });
            index = closingIndex + 1;
            continue;
        }

        if (/[0-9.]/.test(character)) {
            const numberMatch = source
                .slice(index)
                .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
            if (!numberMatch) {
                throw new Error(`Invalid number at character ${index + 1}.`);
            }

            const value = Number(numberMatch[0]);
            if (!Number.isFinite(value)) {
                throw new Error(`Invalid number at character ${index + 1}.`);
            }

            tokens.push({
                type: "number",
                value,
                source: numberMatch[0],
                index,
            });
            index += numberMatch[0].length;
            continue;
        }

        if (character === "\\") {
            const commandMatch = source.slice(index + 1).match(/^[A-Za-z]+/);
            if (!commandMatch) {
                throw new Error(`Invalid LaTeX command at character ${index + 1}.`);
            }

            const command = commandMatch[0];
            const normalized = command.toLowerCase();

            if (normalized === "left" || normalized === "right") {
                index += command.length + 1;
                continue;
            }
            if (normalized === "cdot" || normalized === "times") {
                tokens.push({ type: "operator", value: "*", index });
            } else if (normalized === "div") {
                tokens.push({ type: "operator", value: "/", index });
            } else {
                tokens.push({ type: "identifier", value: command, index });
            }

            index += command.length + 1;
            continue;
        }

        if (isIdentifierStart(character)) {
            let endIndex = index + 1;
            while (
                endIndex < source.length &&
                isIdentifierPart(source[endIndex])
            ) {
                endIndex++;
            }

            tokens.push({
                type: "identifier",
                value: source.slice(index, endIndex),
                index,
            });
            index = endIndex;
            continue;
        }

        if (character === "*" && source[index + 1] === "*") {
            tokens.push({ type: "operator", value: "^", index });
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
            tokens.push({ type: "left-parenthesis", index });
            index++;
            continue;
        }
        if (character === ")") {
            tokens.push({ type: "right-parenthesis", index });
            index++;
            continue;
        }
        if (character === "{") {
            tokens.push({ type: "left-brace", index });
            index++;
            continue;
        }
        if (character === "}") {
            tokens.push({ type: "right-brace", index });
            index++;
            continue;
        }
        if (character === ",") {
            tokens.push({ type: "comma", index });
            index++;
            continue;
        }

        throw new Error(
            `Unexpected character "${character}" at character ${index + 1}.`,
        );
    }

    tokens.push({ type: "end", index: source.length });
    return tokens;
}

function evaluateNode(
    node: CalculatorExpressionNode,
    values: Readonly<Record<string, number>>,
    angleMode: CalculatorAngleMode,
): CalculatorEvaluationResult {
    switch (node.type) {
        case "number":
            return success(node.value);
        case "constant":
            return success(node.name === "pi" ? Math.PI : Math.E);
        case "variable": {
            const value = values[node.name];
            return value === undefined
                ? {
                      status: "incomplete",
                      message: `Enter a value for ${node.name}.`,
                  }
                : success(value);
        }
        case "unary": {
            const operand = evaluateNode(node.operand, values, angleMode);
            if (operand.status !== "success") {
                return operand;
            }
            return checkedNumber(
                node.operator === "+" ? operand.value : -operand.value,
                "The result is outside the supported numeric range.",
            );
        }
        case "binary": {
            const left = evaluateNode(node.left, values, angleMode);
            if (left.status !== "success") {
                return left;
            }
            const right = evaluateNode(node.right, values, angleMode);
            if (right.status !== "success") {
                return right;
            }

            if (node.operator === "/" && right.value === 0) {
                return {
                    status: "undefined",
                    message: "Division by zero is undefined.",
                };
            }

            let result: number;
            switch (node.operator) {
                case "+":
                    result = left.value + right.value;
                    break;
                case "-":
                    result = left.value - right.value;
                    break;
                case "*":
                    result = left.value * right.value;
                    break;
                case "/":
                    result = left.value / right.value;
                    break;
                case "^":
                    result = Math.pow(left.value, right.value);
                    break;
            }

            if (Number.isNaN(result)) {
                return {
                    status: "undefined",
                    message:
                        node.operator === "^"
                            ? "That power does not have a real-number result."
                            : "This operation is undefined for the entered values.",
                };
            }

            return checkedNumber(
                result,
                "The result is outside the supported numeric range.",
            );
        }
        case "function": {
            const definition = functions.get(node.name);
            if (!definition) {
                return {
                    status: "error",
                    message: `Unknown function "${node.name}".`,
                };
            }

            const argumentValues: number[] = [];
            for (const argument of node.arguments) {
                const result = evaluateNode(argument, values, angleMode);
                if (result.status !== "success") {
                    return result;
                }
                argumentValues.push(result.value);
            }

            const validationMessage = definition.validate?.(argumentValues);
            if (validationMessage) {
                return {
                    status: "undefined",
                    message: validationMessage,
                };
            }

            if (
                angleMode === "degrees" &&
                degreeInputFunctions.has(node.name)
            ) {
                const exactDegreeResult =
                    evaluateExactDegreeTrig(
                        node.name,
                        argumentValues[0],
                    );

                if (
                    exactDegreeResult?.status ===
                    "undefined"
                ) {
                    return exactDegreeResult;
                }
                if (
                    exactDegreeResult?.status ===
                    "success"
                ) {
                    return exactDegreeResult;
                }
            }

            const evaluationArguments =
                angleMode === "degrees" &&
                degreeInputFunctions.has(node.name)
                    ? [
                          degreesToRadians(argumentValues[0]),
                          ...argumentValues.slice(1),
                      ]
                    : argumentValues;

            let value = definition.evaluate(evaluationArguments);

            if (
                angleMode === "degrees" &&
                degreeOutputFunctions.has(node.name)
            ) {
                value = radiansToDegrees(value);
            }

            if (Number.isNaN(value)) {
                return {
                    status: "undefined",
                    message: `${node.name} is undefined for the entered value.`,
                };
            }

            return checkedNumber(
                value,
                "The result is outside the supported numeric range.",
            );
        }
    }
}

function evaluateExactDegreeTrig(
    functionName: string,
    angle: number,
): CalculatorEvaluationResult | undefined {
    const quarterTurns = angle / 90;
    const nearestQuarterTurn = Math.round(quarterTurns);

    if (
        Math.abs(quarterTurns - nearestQuarterTurn) >
        1e-12
    ) {
        return undefined;
    }

    const cycleIndex =
        ((nearestQuarterTurn % 4) + 4) % 4;

    if (functionName === "sin") {
        return success([0, 1, 0, -1][cycleIndex]);
    }
    if (functionName === "cos") {
        return success([1, 0, -1, 0][cycleIndex]);
    }
    if (functionName === "tan") {
        if (cycleIndex === 1 || cycleIndex === 3) {
            return {
                status: "undefined",
                message:
                    "tan is undefined at 90° + k·180°.",
            };
        }
        return success(0);
    }

    return undefined;
}

function degreesToRadians(value: number): number {
    return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number): number {
    return (value * 180) / Math.PI;
}

function checkedNumber(
    value: number,
    message: string,
): CalculatorEvaluationResult {
    return Number.isFinite(value)
        ? success(value)
        : {
              status: "undefined",
              message,
          };
}

function success(value: number): CalculatorEvaluationResult {
    return {
        status: "success",
        value,
    };
}

function collectVariables(expression: CalculatorExpressionNode): string[] {
    const variables: string[] = [];
    const seen = new Set<string>();

    visit(expression);
    return variables;

    function visit(node: CalculatorExpressionNode): void {
        if (node.type === "variable") {
            if (!seen.has(node.name)) {
                seen.add(node.name);
                variables.push(node.name);
            }
            return;
        }

        if (node.type === "unary") {
            visit(node.operand);
            return;
        }
        if (node.type === "binary") {
            visit(node.left);
            visit(node.right);
            return;
        }
        if (node.type === "function") {
            node.arguments.forEach(visit);
        }
    }
}

function toLatex(
    node: CalculatorExpressionNode,
    parentPrecedence: number,
): string {
    const precedence = expressionPrecedence(node);
    let value: string;

    switch (node.type) {
        case "number":
            value = numberSourceToLatex(node.source);
            break;
        case "variable":
            value = displayLabelToLatex(node.name);
            break;
        case "constant":
            value = node.name === "pi" ? "\\pi" : "e";
            break;
        case "unary":
            value = `${node.operator}${toLatex(node.operand, precedence)}`;
            break;
        case "binary":
            if (node.operator === "/") {
                value = `\\frac{${toLatex(node.left, 0)}}{${toLatex(node.right, 0)}}`;
            } else if (node.operator === "^") {
                value = `{${toLatex(node.left, precedence)}}^{${toLatex(node.right, 0)}}`;
            } else {
                const operator =
                    node.operator === "*"
                        ? " \\cdot "
                        : ` ${node.operator} `;
                value = `${toLatex(node.left, precedence)}${operator}${toLatex(node.right, precedence + (node.operator === "-" ? 1 : 0))}`;
            }
            break;
        case "function": {
            if (node.name === "sqrt" && node.arguments.length === 1) {
                value = `\\sqrt{${toLatex(node.arguments[0], 0)}}`;
                break;
            }

            const name = functionLatexNames.has(node.name)
                ? `\\${node.name}`
                : `\\operatorname{${escapeLatexIdentifier(node.name)}}`;
            value = `${name}\\left(${node.arguments
                .map((argument) => toLatex(argument, 0))
                .join(", ")}\\right)`;
            break;
        }
    }

    return precedence < parentPrecedence
        ? `\\left(${value}\\right)`
        : value;
}

function expressionPrecedence(node: CalculatorExpressionNode): number {
    if (node.type === "binary") {
        if (node.operator === "+" || node.operator === "-") {
            return 1;
        }
        if (node.operator === "*" || node.operator === "/") {
            return 2;
        }
        return 4;
    }
    if (node.type === "unary") {
        return 3;
    }
    return 5;
}

function numberSourceToLatex(source: string): string {
    const match = source.match(/^(.+?)[eE]([+-]?\d+)$/);
    if (!match) {
        return source;
    }
    return `${match[1]} \\times 10^{${Number(match[2])}}`;
}

function findTopLevelEquals(source: string): number {
    let parentheses = 0;
    let braces = 0;
    let brackets = 0;

    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        if (character === "(") parentheses++;
        else if (character === ")") parentheses--;
        else if (character === "{") braces++;
        else if (character === "}") braces--;
        else if (character === "[") brackets++;
        else if (character === "]") brackets--;
        else if (
            character === "=" &&
            parentheses === 0 &&
            braces === 0 &&
            brackets === 0
        ) {
            return index;
        }
    }

    return -1;
}

function canStartImplicitProduct(token: Token): boolean {
    return (
        token.type === "number" ||
        token.type === "variable" ||
        token.type === "identifier" ||
        token.type === "left-parenthesis" ||
        token.type === "left-brace"
    );
}

function matchingGroupEnd(
    token: Token,
): "right-parenthesis" | "right-brace" | undefined {
    if (token.type === "left-parenthesis") {
        return "right-parenthesis";
    }
    if (token.type === "left-brace") {
        return "right-brace";
    }
    return undefined;
}

function syntaxError(token: Token, message: string): Error {
    return new Error(`${message} at character ${token.index + 1}.`);
}

function unary(
    evaluate: (value: number) => number,
    validate?: (value: number) => string | undefined,
): FunctionDefinition {
    return {
        minimumArguments: 1,
        maximumArguments: 1,
        evaluate(arguments_) {
            return evaluate(arguments_[0]);
        },
        validate: validate
            ? (arguments_) => validate(arguments_[0])
            : undefined,
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

function unitIntervalDomain(functionName: string) {
    return (value: number): string | undefined =>
        value < -1 || value > 1
            ? `${functionName} is only real for values from -1 to 1.`
            : undefined;
}

function isDisplayLabel(value: string): boolean {
    const underscoreIndex = value.indexOf("_");
    if (underscoreIndex !== value.lastIndexOf("_")) {
        return false;
    }

    const base = underscoreIndex >= 0
        ? value.slice(0, underscoreIndex)
        : value;
    const subscript = underscoreIndex >= 0
        ? value.slice(underscoreIndex + 1)
        : "";

    const validBase =
        /^[A-Za-z]$/.test(base) ||
        /^\\[A-Za-z]+$/.test(base) ||
        greekLatexName(base) !== undefined;

    if (!validBase) {
        return false;
    }

    if (!subscript) {
        return true;
    }

    return (
        /^[A-Za-z0-9]+$/.test(subscript) ||
        /^\\[A-Za-z]+$/.test(subscript) ||
        greekLatexName(subscript) !== undefined
    );
}

function isIdentifierStart(character: string): boolean {
    return /[A-Za-zπ]/.test(character);
}

function isIdentifierPart(character: string): boolean {
    return /[A-Za-z0-9_π]/.test(character);
}

function greekLatexName(value: string): string | undefined {
    const normalized = value.toLowerCase();
    const greek = new Set([
        "alpha",
        "beta",
        "gamma",
        "delta",
        "epsilon",
        "zeta",
        "eta",
        "theta",
        "iota",
        "kappa",
        "lambda",
        "mu",
        "nu",
        "xi",
        "pi",
        "rho",
        "sigma",
        "tau",
        "upsilon",
        "phi",
        "chi",
        "psi",
        "omega",
    ]);

    return greek.has(normalized) ? `\\${normalized}` : undefined;
}

function escapeLatexIdentifier(value: string): string {
    return value.replace(/([{}_#$%&])/g, "\\$1");
}
