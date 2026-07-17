import type {
    ChangeEvent,
} from "react";

import type {
    RuntimeParameterValues,
    SimulationParameterDefinitions,
    SimulationParameterValue,
} from "./simulationTypes";

interface SimulationControlsProps {
    definitions:
        SimulationParameterDefinitions;
    values: RuntimeParameterValues;

    onChange(
        key: string,
        value: SimulationParameterValue,
    ): void;
}

export default function SimulationControls({
    definitions,
    values,
    onChange,
}: SimulationControlsProps) {
    return (
        <div className="simulation-controls__parameters">
            {Object.entries(definitions).map(
                ([key, definition]) => {
                    const value = values[key];

                    if (
                        definition.kind ===
                        "range"
                    ) {
                        const numberValue =
                            typeof value ===
                            "number"
                                ? value
                                : definition.initial;

                        return (
                            <label
                                key={key}
                                className="simulation-control simulation-control--range"
                            >
                                <span className="simulation-control__heading">
                                    <span>
                                        {definition.label}
                                    </span>

                                    <output>
                                        {formatNumber(
                                            numberValue,
                                        )}
                                        {definition.unit
                                            ? ` ${definition.unit}`
                                            : ""}
                                    </output>
                                </span>

                                <input
                                    type="range"
                                    min={definition.min}
                                    max={definition.max}
                                    step={
                                        definition.step ??
                                        "any"
                                    }
                                    value={numberValue}
                                    onChange={(
                                        event: ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        onChange(
                                            key,
                                            Number(
                                                event
                                                    .currentTarget
                                                    .value,
                                            ),
                                        );
                                    }}
                                />
                            </label>
                        );
                    }

                    if (
                        definition.kind ===
                        "boolean"
                    ) {
                        const checked =
                            typeof value ===
                            "boolean"
                                ? value
                                : definition.initial;

                        return (
                            <label
                                key={key}
                                className="simulation-control simulation-control--boolean"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(
                                        event: ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        onChange(
                                            key,
                                            event
                                                .currentTarget
                                                .checked,
                                        );
                                    }}
                                />

                                <span>
                                    {definition.label}
                                </span>
                            </label>
                        );
                    }

                    const selectedValue =
                        typeof value === "string"
                            ? value
                            : definition.initial;

                    return (
                        <label
                            key={key}
                            className="simulation-control simulation-control--select"
                        >
                            <span>
                                {definition.label}
                            </span>

                            <select
                                value={selectedValue}
                                onChange={(
                                    event: ChangeEvent<HTMLSelectElement>,
                                ) => {
                                    onChange(
                                        key,
                                        event
                                            .currentTarget
                                            .value,
                                    );
                                }}
                            >
                                {definition.options.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    );
                },
            )}
        </div>
    );
}

function formatNumber(
    value: number,
): string {
    return new Intl.NumberFormat(
        undefined,
        {
            maximumFractionDigits: 3,
        },
    ).format(value);
}
