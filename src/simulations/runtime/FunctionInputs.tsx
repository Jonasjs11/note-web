import {
    useId,
} from "react";

import type {
    ChangeEvent,
} from "react";

import type {
    RuntimeSimulationFunctions,
    SimulationFunctionDefinitions,
} from "./functionDefinitions";

interface FunctionInputsProps {
    definitions:
        SimulationFunctionDefinitions;
    expressions: Record<string, string>;
    functions:
        RuntimeSimulationFunctions;

    onChange(
        key: string,
        expression: string,
    ): void;
}

export default function FunctionInputs({
    definitions,
    expressions,
    functions,
    onChange,
}: FunctionInputsProps) {
    const idPrefix = useId();

    const entries =
        Object.entries(definitions);

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="simulation-functions">
            {entries.map(
                ([key, definition]) => {
                    const functionValue =
                        functions[key];

                    return (
                        <div
                            key={key}
                            className="simulation-function"
                        >
                            <label className="simulation-function__input-row">
                                <span className="simulation-function__name">
                                    {definition.label}
                                </span>

                                <input
                                    type="text"
                                    value={
                                        expressions[
                                            key
                                        ] ??
                                        definition.initial
                                    }
                                    placeholder={
                                        definition.placeholder ??
                                        `Use ${definition.variable} as the independent variable`
                                    }
                                    spellCheck={false}
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    aria-invalid={
                                        functionValue?.error
                                            ? true
                                            : undefined
                                    }
                                    aria-describedby={
                                        functionValue?.error
                                            ? `${idPrefix}-${key}-error`
                                            : undefined
                                    }
                                    onChange={(
                                        event: ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        onChange(
                                            key,
                                            event
                                                .currentTarget
                                                .value,
                                        );
                                    }}
                                />
                            </label>

                            {definition.description && (
                                <div className="simulation-function__description">
                                    {definition.description}
                                </div>
                            )}

                            {functionValue?.error && (
                                <div
                                    id={`${idPrefix}-${key}-error`}
                                    className="simulation-function__error"
                                    role="status"
                                >
                                    {functionValue.error}
                                </div>
                            )}
                        </div>
                    );
                },
            )}
        </div>
    );
}
