export type SimulationParameterValue =
    | number
    | boolean
    | string;

export interface RangeParameterDefinition {
    kind: "range";
    label: string;
    initial: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description?: string;
}

export interface BooleanParameterDefinition {
    kind: "boolean";
    label: string;
    initial: boolean;
    description?: string;
}

export interface SelectParameterOption {
    value: string;
    label: string;
}

export interface SelectParameterDefinition {
    kind: "select";
    label: string;
    initial: string;
    options: readonly SelectParameterOption[];
    description?: string;
}

export type SimulationParameterDefinition =
    | RangeParameterDefinition
    | BooleanParameterDefinition
    | SelectParameterDefinition;

export type SimulationParameterDefinitions =
    Record<
        string,
        SimulationParameterDefinition
    >;

export type ParameterValue<
    Definition extends
        SimulationParameterDefinition,
> = Definition extends RangeParameterDefinition
    ? number
    : Definition extends BooleanParameterDefinition
      ? boolean
      : Definition extends SelectParameterDefinition
        ? string
        : never;

export type SimulationParameterValues<
    Definitions extends
        SimulationParameterDefinitions,
> = {
    [Key in keyof Definitions]:
        ParameterValue<Definitions[Key]>;
};

export type RuntimeParameterValues =
    Record<string, SimulationParameterValue>;

export interface WorldBounds {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    padding?: number;
}
