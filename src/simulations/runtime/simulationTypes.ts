export type SimulationParameterValue =
    | number
    | boolean
    | string;

export interface SimulationParameterBehaviour {
    /**
     * Defaults to true. Set to false for display-only controls such as a
     * coordinate-system selector. Changing such a control redraws the
     * simulation without rebuilding its state or resetting elapsed time.
     */
    resetOnChange?: boolean;
}

export interface RangeParameterDefinition
    extends SimulationParameterBehaviour {
    kind: "range";
    label: string;
    initial: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description?: string;
}

export interface BooleanParameterDefinition
    extends SimulationParameterBehaviour {
    kind: "boolean";
    label: string;
    initial: boolean;
    description?: string;
}

export interface SelectParameterOption {
    value: string;
    label: string;
}

export interface SelectParameterDefinition
    extends SimulationParameterBehaviour {
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

export type SimulationStrokePattern =
    | "solid"
    | "dashed"
    | "dotted"
    | readonly number[];

export interface SimulationStrokeStyle {
    color?: string;
    width?: number;

    /** Named patterns are preferred. A custom Canvas dash array is allowed. */
    pattern?: SimulationStrokePattern;

    /** Backwards-compatible raw dash array. Prefer pattern. */
    dash?: readonly number[];

    dashOffset?: number;
    alpha?: number;
}

export type SimulationAxisLabelStyle =
    | "auto"
    | "plain"
    | "math";

export interface SimulationAxisTickDefinition {
    /** Uses an automatically chosen readable step when omitted. */
    step?: number;

    /** Tick-mark length in CSS pixels. */
    size?: number;

    /** Decimal places. Inferred from the step when omitted. */
    decimals?: number;

    /** Optional unit appended to each tick value. */
    unit?: string;

    /** Defaults to false. The unit is still available for axis labels. */
    showUnit?: boolean;

    stroke?: SimulationStrokeStyle;
}

export interface SimulationAxisDefinition {
    /**
     * Complete axis label, for example "x/m", "t/s", or "E/J".
     * Use labelStyle: "math" to italicise the variable-like numerator while
     * leaving the slash and unit upright. Explicit *italic* spans are also
     * supported.
     */
    label?: string;

    labelStyle?: SimulationAxisLabelStyle;

    /**
     * Deprecated compatibility field. Prefer label: "x/m" and put a tick
     * unit inside ticks.unit. When present, it is rendered with a slash,
     * never parentheses.
     */
    unit?: string;

    /** Set to true for automatic ticks or provide tick options. */
    ticks?:
        | boolean
        | SimulationAxisTickDefinition;

    stroke?: SimulationStrokeStyle;
}

export interface SimulationAxesDefinition {
    x?: SimulationAxisDefinition | false;
    y?: SimulationAxisDefinition | false;
}
