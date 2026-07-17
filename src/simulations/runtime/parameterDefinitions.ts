import type {
    BooleanParameterDefinition,
    RangeParameterDefinition,
    SelectParameterDefinition,
    SelectParameterOption,
    SimulationParameterDefinitions,
    RuntimeParameterValues,
} from "./simulationTypes";

export function rangeParameter(
    definition: Omit<
        RangeParameterDefinition,
        "kind"
    >,
): RangeParameterDefinition {
    return {
        kind: "range",
        ...definition,
    };
}

export function booleanParameter(
    definition: Omit<
        BooleanParameterDefinition,
        "kind"
    >,
): BooleanParameterDefinition {
    return {
        kind: "boolean",
        ...definition,
    };
}

export function selectParameter(
    definition: Omit<
        SelectParameterDefinition,
        "kind" | "options"
    > & {
        options:
            readonly SelectParameterOption[];
    },
): SelectParameterDefinition {
    return {
        kind: "select",
        ...definition,
    };
}

export function createDefaultParameterValues(
    definitions:
        SimulationParameterDefinitions,
): RuntimeParameterValues {
    return Object.fromEntries(
        Object.entries(definitions).map(
            ([key, definition]) => [
                key,
                definition.initial,
            ],
        ),
    );
}
