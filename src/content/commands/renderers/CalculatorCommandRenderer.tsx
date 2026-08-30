import Calculator
    from "../../../calculators/Calculator";

import type {
    CalculatorResultFormat,
} from "../../../calculators/Calculator";

import type {
    CalculatorAngleMode,
} from "../../../calculators/CalculatorExpression";

import type {
    CommandRenderer,
} from "../CommandRenderer";

const CalculatorCommandRenderer:
    CommandRenderer = {
        render(arguments_) {
            const source = arguments_[0] ?? "";
            const precision = parsePrecision(
                arguments_[1],
            );
            const defaultFormat = parseFormat(
                arguments_[2],
            );
            const defaultPreview =
                arguments_[3] === "true";
            const defaultAngleMode = parseAngleMode(
                arguments_[4],
            );
            const angleLocked =
                arguments_[5] === "true";

            return (
                <Calculator
                    source={source}
                    precision={precision}
                    defaultFormat={defaultFormat}
                    defaultPreview={defaultPreview}
                    defaultAngleMode={defaultAngleMode}
                    angleLocked={angleLocked}
                />
            );
        },
    };

function parsePrecision(
    source: string | undefined,
): number {
    const value = Number(source);
    return Number.isInteger(value) &&
        value >= 1 &&
        value <= 15
        ? value
        : 6;
}

function parseFormat(
    source: string | undefined,
): CalculatorResultFormat {
    return source === "scientific"
        ? "scientific"
        : "decimal";
}

function parseAngleMode(
    source: string | undefined,
): CalculatorAngleMode {
    return source === "degrees"
        ? "degrees"
        : "radians";
}

export default CalculatorCommandRenderer;
