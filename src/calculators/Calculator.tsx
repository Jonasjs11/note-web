import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
    ReactNode,
} from "react";


import {
    calculatorExpressionToLatex,
    evaluateCalculatorExpression,
    parseCalculatorDefinition,
    parseFreeCalculatorExpression,
    parseNumericInput,
} from "./CalculatorExpression";

import type {
    CalculatorAngleMode,
    CalculatorDefinition,
    CalculatorEvaluationResult,
    CalculatorExpressionNode,
} from "./CalculatorExpression";

import "./Calculator.css";

export type CalculatorResultFormat =
    | "decimal"
    | "scientific";

export interface CalculatorProps {
    source: string;
    precision?: number;
    defaultFormat?: CalculatorResultFormat;
    defaultPreview?: boolean;
    defaultAngleMode?: CalculatorAngleMode;
    angleLocked?: boolean;
}

export default function Calculator({
    source,
    precision = 6,
    defaultFormat = "decimal",
    defaultPreview = false,
    defaultAngleMode = "radians",
    angleLocked = false,
}: CalculatorProps) {
    const trimmedSource = source.trim();
    const definitionResult = useMemo(() => {
        if (!trimmedSource) {
            return undefined;
        }

        try {
            return {
                definition:
                    parseCalculatorDefinition(
                        trimmedSource,
                    ),
            };
        } catch (error: unknown) {
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : "Invalid calculator formula.",
            };
        }
    }, [trimmedSource]);

    if (definitionResult?.error) {
        return (
            <div className="calculator calculator--error">
                <div className="calculator__error-message">
                    {definitionResult.error}
                </div>
            </div>
        );
    }

    if (definitionResult?.definition) {
        return (
            <FormulaCalculator
                definition={
                    definitionResult.definition
                }
                precision={precision}
                defaultFormat={defaultFormat}
                defaultAngleMode={defaultAngleMode}
                angleLocked={angleLocked}
            />
        );
    }

    return (
        <FreeCalculator
            precision={precision}
            defaultFormat={defaultFormat}
            defaultPreview={defaultPreview}
            defaultAngleMode={defaultAngleMode}
        />
    );
}

interface SharedCalculatorProps {
    precision: number;
    defaultFormat: CalculatorResultFormat;
    defaultAngleMode: CalculatorAngleMode;
}

function FormulaCalculator({
    definition,
    precision,
    defaultFormat,
    defaultAngleMode,
    angleLocked,
}: SharedCalculatorProps & {
    definition: CalculatorDefinition;
    angleLocked: boolean;
}) {
    const [inputs, setInputs] = useState<
        Record<string, string>
    >(() =>
        Object.fromEntries(
            definition.variables.map((name) => [
                name,
                "",
            ]),
        ),
    );
    const [resultFormat, setResultFormat] =
        useState<CalculatorResultFormat>(
            defaultFormat,
        );
    const [angleMode, setAngleMode] =
        useState<CalculatorAngleMode>(
            defaultAngleMode,
        );
    const [mode, setMode] = useState<
        "formula" | "free"
    >("formula");
    const [freeInitialized, setFreeInitialized] =
        useState(false);
    const [freeInitialFormat, setFreeInitialFormat] =
        useState<CalculatorResultFormat>(defaultFormat);
    const [freeInitialAngleMode, setFreeInitialAngleMode] =
        useState<CalculatorAngleMode>(defaultAngleMode);

    const formulaAngleMode = angleLocked
        ? defaultAngleMode
        : angleMode;

    const variableEvaluations = useMemo(() => {
        const evaluations: Record<
            string,
            CalculatorEvaluationResult
        > = {};

        for (const variable of definition.variables) {
            evaluations[variable] =
                evaluateVariableInputExpression(
                    inputs[variable] ?? "",
                    formulaAngleMode,
                );
        }

        return evaluations;
    }, [definition.variables, inputs, formulaAngleMode]);

    const evaluation = useMemo(() => {
        const values: Record<string, number> = {};

        for (const variable of definition.variables) {
            const variableEvaluation =
                variableEvaluations[variable];

            if (
                !variableEvaluation ||
                variableEvaluation.status === "incomplete"
            ) {
                return {
                    status: "incomplete",
                } satisfies CalculatorEvaluationResult;
            }

            if (variableEvaluation.status === "error") {
                return {
                    status: "error",
                    message: `${variable}: ${variableEvaluation.message}`,
                } satisfies CalculatorEvaluationResult;
            }

            if (variableEvaluation.status === "undefined") {
                return {
                    status: "undefined",
                    message: `${variable}: ${variableEvaluation.message}`,
                } satisfies CalculatorEvaluationResult;
            }

            values[variable] = variableEvaluation.value;
        }

        return evaluateCalculatorExpression(
            definition.expression,
            values,
            formulaAngleMode,
        );
    }, [
        definition.expression,
        definition.variables,
        variableEvaluations,
        formulaAngleMode,
    ]);

    const mirrorValues = useMemo(() => {
        const values: Record<string, string> = {};

        for (const variable of definition.variables) {
            const variableEvaluation =
                variableEvaluations[variable];
            values[variable] =
                variableEvaluation?.status === "success"
                    ? formatResult(
                          variableEvaluation.value,
                          precision,
                          resultFormat,
                      )
                    : "";
        }

        return values;
    }, [
        definition.variables,
        variableEvaluations,
        precision,
        resultFormat,
    ]);

    const editableVariables = useMemo(
        () =>
            collectFirstVariableNodes(
                definition.expression,
            ),
        [definition],
    );

    function switchToFree(): void {
        if (!freeInitialized) {
            setFreeInitialFormat(resultFormat);
            setFreeInitialAngleMode(formulaAngleMode);
            setFreeInitialized(true);
        }
        setMode("free");
    }

    return (
        <>
            <div
                className="calculator calculator--formula"
                hidden={mode !== "formula"}
            >
                <div className="calculator__formula-scroll">
                    <div className="calculator__formula-row">
                        <MathLabel
                            label={definition.outputLabel}
                            className="calculator__output-label"
                        />
                        <span className="calculator__equals">
                            =
                        </span>
                        <ExpressionDisplay
                            node={definition.expression}
                            inputs={inputs}
                            mirrorValues={mirrorValues}
                            editableVariables={editableVariables}
                            onInputChange={(name, value) => {
                                setInputs((current) => ({
                                    ...current,
                                    [name]: value,
                                }));
                            }}
                        />
                        <span className="calculator__equals">
                            =
                        </span>
                        <CalculatorResult
                            evaluation={evaluation}
                            precision={precision}
                            format={resultFormat}
                        />
                    </div>
                </div>

                <CalculatorToolbar
                    format={resultFormat}
                    onFormatChange={setResultFormat}
                    angleMode={formulaAngleMode}
                    onAngleModeChange={setAngleMode}
                    angleLocked={angleLocked}
                    modeAction={{
                        label: "Free",
                        title: "Switch to a free calculator",
                        action: switchToFree,
                    }}
                />

                <EvaluationMessage
                    evaluation={evaluation}
                />
            </div>

            {freeInitialized && (
                <FreeCalculator
                    hidden={mode !== "free"}
                    precision={precision}
                    defaultFormat={freeInitialFormat}
                    defaultPreview={false}
                    defaultAngleMode={freeInitialAngleMode}
                    onAngleModeChange={
                        angleLocked
                            ? undefined
                            : setAngleMode
                    }
                    modeAction={{
                        label: "Formula",
                        title: "Switch back to the predefined formula",
                        action: () => setMode("formula"),
                    }}
                />
            )}
        </>
    );
}

function evaluateVariableInputExpression(
    source: string,
    angleMode: CalculatorAngleMode,
): CalculatorEvaluationResult {
    const trimmed = source
        .trim()
        .replace(/=\s*$/, "")
        .trim();

    if (!trimmed) {
        return { status: "incomplete" };
    }

    /*
     * Keep partially typed numeric/scientific notation quiet while the reader
     * is still entering it, then fall through to the full calculator parser
     * for constants, functions, and arithmetic such as pi, sqrt(2), or 2*pi.
     */
    const numeric = parseNumericInput(trimmed);
    if (numeric.status === "valid") {
        return {
            status: "success",
            value: numeric.value,
        };
    }
    if (numeric.status === "incomplete") {
        return { status: "incomplete" };
    }

    try {
        const expression =
            parseFreeCalculatorExpression(trimmed);
        return evaluateCalculatorExpression(
            expression,
            {},
            angleMode,
        );
    } catch (error: unknown) {
        return {
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Invalid variable expression.",
        };
    }
}


function FreeCalculator({
    precision,
    defaultFormat,
    defaultPreview,
    defaultAngleMode,
    hidden = false,
    onAngleModeChange,
    modeAction,
}: SharedCalculatorProps & {
    defaultPreview: boolean;
    hidden?: boolean;
    onAngleModeChange?(mode: CalculatorAngleMode): void;
    modeAction?: ToolbarAction;
}) {
    const [input, setInput] = useState("");
    const [resultFormat, setResultFormat] =
        useState<CalculatorResultFormat>(
            defaultFormat,
        );
    const [angleMode, setAngleMode] =
        useState<CalculatorAngleMode>(
            defaultAngleMode,
        );
    const [showPreview, setShowPreview] =
        useState(defaultPreview);
    const [previewExpanded, setPreviewExpanded] =
        useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const hasEquals = /=\s*$/.test(input);
    const expressionSource = hasEquals
        ? input.replace(/=\s*$/, "").trim()
        : input.trim();

    const parsedExpression = useMemo(() => {
        if (!expressionSource) {
            return undefined;
        }
        try {
            return {
                expression:
                    parseFreeCalculatorExpression(
                        expressionSource,
                    ),
            };
        } catch (error: unknown) {
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : "Invalid expression.",
            };
        }
    }, [expressionSource]);

    const evaluation: CalculatorEvaluationResult =
        !hasEquals
            ? { status: "incomplete" }
            : !expressionSource
              ? {
                    status: "error",
                    message:
                        "Enter an expression before =.",
                }
              : parsedExpression?.expression
                ? evaluateCalculatorExpression(
                      parsedExpression.expression,
                      {},
                      angleMode,
                  )
                : {
                      status: "error",
                      message:
                          parsedExpression?.error ??
                          "Invalid expression.",
                  };

    const previewLatex =
        parsedExpression?.expression
            ? calculatorExpressionToLatex(
                  parsedExpression.expression,
              )
            : undefined;

    function insertSnippet(
        snippet: string,
        cursorOffset: number,
    ): void {
        const element = inputRef.current;
        const start = element?.selectionStart ?? input.length;
        const end = element?.selectionEnd ?? start;
        const next =
            input.slice(0, start) +
            snippet +
            input.slice(end);

        setInput(next);

        requestAnimationFrame(() => {
            const nextElement = inputRef.current;
            if (!nextElement) {
                return;
            }
            const cursor = start + cursorOffset;
            nextElement.focus();
            nextElement.setSelectionRange(
                cursor,
                cursor,
            );
        });
    }

    return (
        <div className="calculator calculator--free" hidden={hidden}>
            <div className="calculator__free-row">
                <input
                    ref={inputRef}
                    className="calculator__expression-input"
                    type="text"
                    value={input}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setInput(event.target.value)
                    }
                    placeholder="e.g. 2*pi*3^2 ="
                    aria-label="Calculator expression"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                />
                <CalculatorResult
                    evaluation={evaluation}
                    precision={precision}
                    format={resultFormat}
                    hidden={!hasEquals}
                />
            </div>

            <CalculatorToolbar
                format={resultFormat}
                onFormatChange={setResultFormat}
                angleMode={angleMode}
                onAngleModeChange={(nextMode) => {
                    setAngleMode(nextMode);
                    onAngleModeChange?.(nextMode);
                }}
                preview={showPreview}
                onPreviewChange={setShowPreview}
                modeAction={modeAction}
                insertActions={[
                    {
                        label: "a/b",
                        title: "Insert fraction",
                        action: () =>
                            insertSnippet("()/()", 1),
                    },
                    {
                        label: "xʸ",
                        title: "Insert exponent",
                        action: () =>
                            insertSnippet("^()", 2),
                    },
                    {
                        label: "√",
                        title: "Insert square root",
                        action: () =>
                            insertSnippet("sqrt()", 5),
                    },
                    {
                        label: "π",
                        title: "Insert pi",
                        action: () =>
                            insertSnippet("pi", 2),
                    },
                    {
                        label: "sin",
                        title: "Insert sine",
                        action: () =>
                            insertSnippet("sin()", 4),
                    },
                    {
                        label: "ln",
                        title: "Insert natural logarithm",
                        action: () =>
                            insertSnippet("ln()", 3),
                    },
                ]}
            />

            {showPreview && (
                <div
                    className={
                        previewExpanded
                            ? "calculator__preview calculator__preview--expanded"
                            : "calculator__preview calculator__preview--compact"
                    }
                >
                    <span className="calculator__preview-label">
                        Preview
                    </span>
                    <span className="calculator__preview-math">
                        {previewLatex ? (
                            <MathJaxPreview
                                latex={previewLatex}
                            />
                        ) : (
                            <span className="calculator__preview-placeholder">
                                {expressionSource
                                    ? "Complete the expression to preview it."
                                    : "Type an expression to preview it."}
                            </span>
                        )}
                    </span>
                    <button
                        type="button"
                        className="calculator__preview-zoom"
                        aria-pressed={previewExpanded}
                        aria-label={
                            previewExpanded
                                ? "Use compact preview"
                                : "Enlarge preview"
                        }
                        title={
                            previewExpanded
                                ? "Use compact preview"
                                : "Enlarge preview"
                        }
                        onClick={() =>
                            setPreviewExpanded((value) => !value)
                        }
                    >
                        {previewExpanded ? "−" : "+"}
                    </button>
                </div>
            )}

            <EvaluationMessage
                evaluation={evaluation}
                hidden={!hasEquals}
            />
        </div>
    );
}

function MathJaxPreview({
    latex,
}: {
    latex: string;
}) {
    const rootRef = useRef<HTMLSpanElement | null>(null);
    const renderQueueRef = useRef<Promise<void>>(
        Promise.resolve(),
    );

    useLayoutEffect(() => {
        const root = rootRef.current;
        const mathJax = window.MathJax;

        if (!root) {
            return;
        }

        if (!mathJax) {
            root.textContent = latex;
            return () => {
                root.replaceChildren();
            };
        }

        /*
         * Snapshot the narrowed values before entering the async render queue.
         * TypeScript cannot safely preserve narrowing for `window.MathJax` or
         * a ref-derived DOM node across an asynchronous closure.
         */
        const previewRoot = root;
        const previewMathJax = mathJax;
        let cancelled = false;

        async function renderPreview(): Promise<void> {
            try {
                await previewMathJax.startup?.promise;

                if (cancelled) {
                    return;
                }

                /*
                 * React deliberately renders no children inside this span.
                 * MathJax therefore owns everything below `previewRoot`,
                 * avoiding a React/MathJax removeChild collision when the
                 * preview changes.
                 */
                previewMathJax.typesetClear?.([previewRoot]);
                previewRoot.replaceChildren();
                previewRoot.textContent = `\\(${latex}\\)`;

                await previewMathJax.typesetPromise?.([previewRoot]);

                if (cancelled) {
                    previewMathJax.typesetClear?.([previewRoot]);
                    previewRoot.replaceChildren();
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    previewRoot.replaceChildren();
                    previewRoot.textContent = latex;
                    console.error(
                        "MathJax failed to render the calculator preview.",
                        error,
                    );
                }
            }
        }

        /*
         * MathJax typesetting is asynchronous. Queue preview updates so an
         * older render cannot finish after a newer keystroke and overwrite it.
         */
        renderQueueRef.current = renderQueueRef.current
            .catch(() => undefined)
            .then(renderPreview);

        return () => {
            cancelled = true;
        };
    }, [latex]);

    return (
        <span
            ref={rootRef}
            className="calculator__mathjax-preview"
            aria-label={`Rendered expression: ${latex}`}
        />
    );
}

interface ExpressionDisplayProps {
    node: CalculatorExpressionNode;
    inputs: Record<string, string>;
    mirrorValues: Record<string, string>;
    editableVariables: WeakSet<CalculatorExpressionNode>;
    onInputChange(
        name: string,
        value: string,
    ): void;
    parentPrecedence?: number;
    rightSideOfSubtraction?: boolean;
}

function ExpressionDisplay({
    node,
    inputs,
    mirrorValues,
    editableVariables,
    onInputChange,
    parentPrecedence = 0,
    rightSideOfSubtraction = false,
}: ExpressionDisplayProps) {
    const precedence = displayPrecedence(node);
    const needsParentheses =
        precedence < parentPrecedence ||
        (rightSideOfSubtraction &&
            node.type === "binary" &&
            (node.operator === "+" ||
                node.operator === "-"));

    let content: ReactNode;

    switch (node.type) {
        case "number":
            content = (
                <span className="calculator__number">
                    {node.source}
                </span>
            );
            break;
        case "constant":
            content = (
                <span className="calculator__constant">
                    {node.name === "pi" ? "π" : "e"}
                </span>
            );
            break;
        case "variable": {
            const editable =
                editableVariables.has(node);
            content = (
                <VariableField
                    name={node.name}
                    value={
                        editable
                            ? inputs[node.name] ?? ""
                            : mirrorValues[node.name] ?? ""
                    }
                    editable={editable}
                    onChange={(value) =>
                        onInputChange(node.name, value)
                    }
                />
            );
            break;
        }
        case "unary":
            content = (
                <span className="calculator__inline-expression">
                    <span className="calculator__operator">
                        {node.operator}
                    </span>
                    <ExpressionDisplay
                        node={node.operand}
                        inputs={inputs}
                        mirrorValues={mirrorValues}
                        editableVariables={editableVariables}
                        onInputChange={onInputChange}
                        parentPrecedence={precedence}
                    />
                </span>
            );
            break;
        case "binary":
            if (node.operator === "/") {
                content = (
                    <span className="calculator-fraction">
                        <span className="calculator-fraction__numerator">
                            <ExpressionDisplay
                                node={node.left}
                                inputs={inputs}
                                mirrorValues={mirrorValues}
                                editableVariables={editableVariables}
                                onInputChange={onInputChange}
                            />
                        </span>
                        <span className="calculator-fraction__denominator">
                            <ExpressionDisplay
                                node={node.right}
                                inputs={inputs}
                                mirrorValues={mirrorValues}
                                editableVariables={editableVariables}
                                onInputChange={onInputChange}
                            />
                        </span>
                    </span>
                );
            } else if (node.operator === "^") {
                content = (
                    <span className="calculator-power">
                        <span className="calculator-power__base">
                            <ExpressionDisplay
                                node={node.left}
                                inputs={inputs}
                                mirrorValues={mirrorValues}
                                editableVariables={editableVariables}
                                onInputChange={onInputChange}
                                parentPrecedence={precedence}
                            />
                        </span>
                        <span className="calculator-power__exponent">
                            <ExpressionDisplay
                                node={node.right}
                                inputs={inputs}
                                mirrorValues={mirrorValues}
                                editableVariables={editableVariables}
                                onInputChange={onInputChange}
                            />
                        </span>
                    </span>
                );
            } else {
                content = (
                    <span className="calculator__inline-expression">
                        <ExpressionDisplay
                            node={node.left}
                            inputs={inputs}
                            mirrorValues={mirrorValues}
                            editableVariables={editableVariables}
                            onInputChange={onInputChange}
                            parentPrecedence={precedence}
                        />
                        <span className="calculator__operator">
                            {node.operator === "*"
                                ? "·"
                                : node.operator}
                        </span>
                        <ExpressionDisplay
                            node={node.right}
                            inputs={inputs}
                            mirrorValues={mirrorValues}
                            editableVariables={editableVariables}
                            onInputChange={onInputChange}
                            parentPrecedence={precedence}
                            rightSideOfSubtraction={
                                node.operator === "-"
                            }
                        />
                    </span>
                );
            }
            break;
        case "function":
            if (
                node.name === "sqrt" &&
                node.arguments.length === 1
            ) {
                content = (
                    <span className="calculator-root">
                        <span className="calculator-root__symbol">
                            √
                        </span>
                        <span className="calculator-root__body">
                            <ExpressionDisplay
                                node={node.arguments[0]}
                                inputs={inputs}
                                mirrorValues={mirrorValues}
                                editableVariables={editableVariables}
                                onInputChange={onInputChange}
                            />
                        </span>
                    </span>
                );
            } else {
                content = (
                    <span className="calculator-function">
                        <span className="calculator-function__name">
                            {node.name}
                        </span>
                        <span>(</span>
                        {node.arguments.map(
                            (argument, index) => (
                                <span
                                    key={index}
                                    className="calculator__inline-expression"
                                >
                                    {index > 0 && (
                                        <span>,</span>
                                    )}
                                    <ExpressionDisplay
                                        node={argument}
                                        inputs={inputs}
                                        mirrorValues={mirrorValues}
                                        editableVariables={editableVariables}
                                        onInputChange={onInputChange}
                                    />
                                </span>
                            ),
                        )}
                        <span>)</span>
                    </span>
                );
            }
            break;
    }

    return needsParentheses ? (
        <span className="calculator__group">
            <span>(</span>
            {content}
            <span>)</span>
        </span>
    ) : (
        <>{content}</>
    );
}

function VariableField({
    name,
    value,
    editable,
    onChange,
}: {
    name: string;
    value: string;
    editable: boolean;
    onChange(value: string): void;
}) {
    return (
        <label
            className={
                editable
                    ? "calculator-variable-field"
                    : "calculator-variable-field calculator-variable-field--mirror"
            }
        >
            <input
                type="text"
                value={value}
                disabled={!editable}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onChange(event.target.value)
                }
                aria-label={
                    editable
                        ? `Expression for ${name}`
                        : `Computed value for ${name}`
                }
                title={
                    !editable && value
                        ? `${name} = ${value}`
                        : undefined
                }
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
            />
            <span className="calculator-variable-field__label">
                <MathLabel label={name} />
            </span>
        </label>
    );
}

function MathLabel({
    label,
    className,
}: {
    label: string;
    className?: string;
}) {
    const normalized = label.startsWith("\\")
        ? label.slice(1)
        : label;
    const underscoreIndex =
        normalized.indexOf("_");
    const base = underscoreIndex >= 0
        ? normalized.slice(0, underscoreIndex)
        : normalized;
    const subscript = underscoreIndex >= 0
        ? normalized.slice(underscoreIndex + 1)
        : undefined;

    return (
        <span className={className}>
            {greekGlyph(base) ?? base}
            {subscript && (
                <sub>
                    {greekGlyph(subscript) ?? subscript}
                </sub>
            )}
        </span>
    );
}

interface ToolbarAction {
    label: string;
    title: string;
    action(): void;
}

function CalculatorToolbar({
    format,
    onFormatChange,
    angleMode,
    onAngleModeChange,
    angleLocked = false,
    preview,
    onPreviewChange,
    modeAction,
    insertActions = [],
}: {
    format: CalculatorResultFormat;
    onFormatChange(
        format: CalculatorResultFormat,
    ): void;
    angleMode: CalculatorAngleMode;
    onAngleModeChange(mode: CalculatorAngleMode): void;
    angleLocked?: boolean;
    preview?: boolean;
    onPreviewChange?(value: boolean): void;
    modeAction?: ToolbarAction;
    insertActions?: ToolbarAction[];
}) {
    return (
        <div className="calculator-toolbar">
            <div className="calculator-toolbar__insert">
                {insertActions.map((action) => (
                    <button
                        key={action.title}
                        type="button"
                        className="calculator-toolbar__button"
                        title={action.title}
                        onClick={action.action}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <div className="calculator-toolbar__view">
                {onPreviewChange && (
                    <button
                        type="button"
                        className="calculator-toolbar__button calculator-toolbar__button--text"
                        aria-pressed={preview}
                        onClick={() =>
                            onPreviewChange(!preview)
                        }
                    >
                        Preview
                    </button>
                )}
                <div
                    className={
                        angleLocked
                            ? "calculator-toolbar__segmented calculator-toolbar__segmented--locked"
                            : "calculator-toolbar__segmented"
                    }
                    aria-label={
                        angleLocked
                            ? "Angle mode, locked by the note author"
                            : "Angle mode"
                    }
                >
                    <button
                        type="button"
                        aria-pressed={
                            angleMode === "radians"
                        }
                        disabled={angleLocked}
                        title={
                            angleLocked
                                ? "Angle mode is locked by the note author"
                                : "Use radians for trigonometric functions"
                        }
                        onClick={() =>
                            onAngleModeChange(
                                "radians",
                            )
                        }
                    >
                        Rad
                    </button>
                    <button
                        type="button"
                        aria-pressed={
                            angleMode === "degrees"
                        }
                        disabled={angleLocked}
                        title={
                            angleLocked
                                ? "Angle mode is locked by the note author"
                                : "Use degrees for trigonometric functions"
                        }
                        onClick={() =>
                            onAngleModeChange(
                                "degrees",
                            )
                        }
                    >
                        Deg
                    </button>
                </div>
                <div
                    className="calculator-toolbar__segmented"
                    aria-label="Result format"
                >
                    <button
                        type="button"
                        aria-pressed={
                            format === "decimal"
                        }
                        title="Decimal result"
                        onClick={() =>
                            onFormatChange("decimal")
                        }
                    >
                        123
                    </button>
                    <button
                        type="button"
                        aria-pressed={
                            format === "scientific"
                        }
                        title="Scientific notation"
                        onClick={() =>
                            onFormatChange(
                                "scientific",
                            )
                        }
                    >
                        1e3
                    </button>
                </div>
                {modeAction && (
                    <button
                        type="button"
                        className="calculator-toolbar__button calculator-toolbar__button--text calculator-toolbar__mode-switch"
                        title={modeAction.title}
                        onClick={modeAction.action}
                    >
                        {modeAction.label}
                    </button>
                )}
            </div>
        </div>
    );
}

function CalculatorResult({
    evaluation,
    precision,
    format,
    hidden = false,
}: {
    evaluation: CalculatorEvaluationResult;
    precision: number;
    format: CalculatorResultFormat;
    hidden?: boolean;
}) {
    let text = "";

    if (!hidden) {
        if (evaluation.status === "success") {
            text = formatResult(
                evaluation.value,
                precision,
                format,
            );
        } else if (
            evaluation.status === "undefined"
        ) {
            text = "undefined";
        } else if (evaluation.status === "error") {
            text = "error";
        } else if (evaluation.status === "incomplete") {
            text = "";
        }
    }

    return (
        <output
            className="calculator-result"
            aria-live="polite"
        >
            {text}
        </output>
    );
}

function EvaluationMessage({
    evaluation,
    hidden = false,
}: {
    evaluation: CalculatorEvaluationResult;
    hidden?: boolean;
}) {
    if (
        hidden ||
        evaluation.status === "success" ||
        evaluation.status === "incomplete"
    ) {
        return null;
    }

    return (
        <div
            className={
                evaluation.status === "error"
                    ? "calculator__message calculator__message--error"
                    : "calculator__message"
            }
            role={
                evaluation.status === "error"
                    ? "alert"
                    : "status"
            }
        >
            {evaluation.message}
        </div>
    );
}

function formatResult(
    value: number,
    precision: number,
    format: CalculatorResultFormat,
): string {
    const safePrecision = Math.min(
        15,
        Math.max(1, Math.round(precision)),
    );

    if (value === 0) {
        return "0";
    }

    if (format === "scientific") {
        const exponent = Math.floor(
            Math.log10(Math.abs(value)),
        );
        const coefficient =
            value / Math.pow(10, exponent);
        const rounded = Number(
            coefficient.toPrecision(
                safePrecision,
            ),
        ).toString();
        return `${rounded} × 10${toSuperscript(exponent)}`;
    }

    return new Intl.NumberFormat(undefined, {
        maximumSignificantDigits: safePrecision,
        useGrouping: false,
    }).format(value);
}

function toSuperscript(value: number): string {
    const characters: Record<string, string> = {
        "-": "⁻",
        "+": "⁺",
        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹",
    };

    return value
        .toString()
        .split("")
        .map((character) =>
            characters[character] ?? character,
        )
        .join("");
}

function collectFirstVariableNodes(
    expression: CalculatorExpressionNode,
): WeakSet<CalculatorExpressionNode> {
    const firstNodes =
        new WeakSet<CalculatorExpressionNode>();
    const names = new Set<string>();

    visit(expression);
    return firstNodes;

    function visit(
        node: CalculatorExpressionNode,
    ): void {
        if (node.type === "variable") {
            if (!names.has(node.name)) {
                names.add(node.name);
                firstNodes.add(node);
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

function displayPrecedence(
    node: CalculatorExpressionNode,
): number {
    if (node.type === "binary") {
        if (
            node.operator === "+" ||
            node.operator === "-"
        ) {
            return 1;
        }
        if (
            node.operator === "*" ||
            node.operator === "/"
        ) {
            return 2;
        }
        return 4;
    }
    if (node.type === "unary") {
        return 3;
    }
    return 5;
}

function greekGlyph(value: string): string | undefined {
    const glyphs: Record<string, string> = {
        alpha: "α",
        beta: "β",
        gamma: "γ",
        delta: "δ",
        epsilon: "ε",
        zeta: "ζ",
        eta: "η",
        theta: "θ",
        iota: "ι",
        kappa: "κ",
        lambda: "λ",
        mu: "μ",
        nu: "ν",
        xi: "ξ",
        pi: "π",
        rho: "ρ",
        sigma: "σ",
        tau: "τ",
        upsilon: "υ",
        phi: "φ",
        chi: "χ",
        psi: "ψ",
        omega: "ω",
    };

    return glyphs[value.toLowerCase()];
}
