import type {
    ScreenPoint,
} from "./Viewport2D";

import type {
    SimulationAxisDefinition,
    SimulationAxisLabelStyle,
    SimulationStrokePattern,
    SimulationStrokeStyle,
} from "./simulationTypes";

import {
    Viewport2D,
} from "./Viewport2D";

export interface SimulationPalette {
    background: string;
    foreground: string;
    muted: string;
    grid: string;
    accent: string;
    secondary: string;
    danger: string;
}

export type StrokeStyle =
    SimulationStrokeStyle;

export interface FillStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokePattern?: SimulationStrokePattern;
    strokeDashOffset?: number;
    alpha?: number;
}

export interface TextOptions {
    x: number;
    y: number;
    text: string;
    color?: string;
    size?: number;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    weight?: number;
    italic?: boolean;
    rotation?: number;
}

export interface RichTextRun {
    text: string;
    italic?: boolean;
    weight?: number;
}

export interface RichTextOptions
    extends Omit<TextOptions, "text" | "italic"> {
    runs: readonly RichTextRun[];
}

export interface FunctionGraphOptions {
    domain?: {
        min: number;
        max: number;
    };
    samples?: number;
    color?:
        | keyof SimulationPalette
        | string;
    width?: number;
    pattern?: SimulationStrokePattern;
    alpha?: number;
}

export interface ParametricGraphOptions
    extends FunctionGraphOptions {
    domain: {
        min: number;
        max: number;
    };
}

export interface GridOptions {
    /** Vertical lines at x values. Defaults to true. */
    x?: boolean;

    /** Horizontal lines at y values. Defaults to true. */
    y?: boolean;

    xStep?: number;
    yStep?: number;

    stroke?: StrokeStyle;
    xStroke?: StrokeStyle;
    yStroke?: StrokeStyle;
}

export interface AxesOptions {
    /** Backwards-compatible labels for manually rendered axes. */
    xLabel?: string;
    yLabel?: string;

    /** Explicit axis definitions used by the simulation runtime. */
    x?: SimulationAxisDefinition | false;
    y?: SimulationAxisDefinition | false;
}

export class CanvasGraphics {
    readonly rawContext:
        CanvasRenderingContext2D;

    private readonly canvas:
        HTMLCanvasElement;

    private paletteValue:
        SimulationPalette;

    private cssWidthValue = 1;
    private cssHeightValue = 1;

    constructor(
        canvas: HTMLCanvasElement,
        palette: SimulationPalette,
    ) {
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error(
                "Canvas 2D is unavailable.",
            );
        }

        this.canvas = canvas;
        this.rawContext = context;
        this.paletteValue = palette;
    }

    get width(): number {
        return this.cssWidthValue;
    }

    get height(): number {
        return this.cssHeightValue;
    }

    get palette(): SimulationPalette {
        return this.paletteValue;
    }

    setPalette(
        palette: SimulationPalette,
    ) {
        this.paletteValue = palette;
    }

    resize(
        cssWidth: number,
        cssHeight: number,
        devicePixelRatio: number,
    ) {
        const width = Math.max(
            1,
            Math.round(cssWidth),
        );

        const height = Math.max(
            1,
            Math.round(cssHeight),
        );

        const ratio = Math.max(
            1,
            devicePixelRatio,
        );

        const backingWidth = Math.round(
            width * ratio,
        );

        const backingHeight = Math.round(
            height * ratio,
        );

        if (
            this.canvas.width !== backingWidth ||
            this.canvas.height !== backingHeight
        ) {
            this.canvas.width = backingWidth;
            this.canvas.height = backingHeight;
        }

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.rawContext.setTransform(
            ratio,
            0,
            0,
            ratio,
            0,
            0,
        );

        this.cssWidthValue = width;
        this.cssHeightValue = height;
    }

    clear(
        color = this.palette.background,
    ) {
        const context = this.rawContext;

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
        );
        context.restore();

        context.fillStyle = color;
        context.fillRect(
            0,
            0,
            this.width,
            this.height,
        );
    }

    line(
        from: ScreenPoint,
        to: ScreenPoint,
        style: StrokeStyle = {},
    ) {
        const context = this.rawContext;

        context.save();
        applyStrokeStyle(
            context,
            style,
            this.palette.foreground,
        );

        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.restore();
    }

    polyline(
        points: readonly ScreenPoint[],
        style: StrokeStyle = {},
    ) {
        if (points.length < 2) {
            return;
        }

        const context = this.rawContext;

        context.save();
        applyStrokeStyle(
            context,
            style,
            this.palette.accent,
        );

        context.beginPath();
        context.moveTo(
            points[0].x,
            points[0].y,
        );

        for (
            let index = 1;
            index < points.length;
            index++
        ) {
            context.lineTo(
                points[index].x,
                points[index].y,
            );
        }

        context.stroke();
        context.restore();
    }

    circle(
        center: ScreenPoint,
        radius: number,
        style: FillStyle = {},
    ) {
        const context = this.rawContext;

        context.save();
        context.globalAlpha =
            style.alpha ?? 1;

        context.beginPath();
        context.arc(
            center.x,
            center.y,
            Math.max(0, radius),
            0,
            Math.PI * 2,
        );

        if (style.fill !== "none") {
            context.fillStyle =
                style.fill ??
                this.palette.accent;
            context.fill();
        }

        if (style.stroke) {
            applyStrokeStyle(
                context,
                {
                    color: style.stroke,
                    width:
                        style.strokeWidth ?? 1,
                    pattern:
                        style.strokePattern,
                    dashOffset:
                        style.strokeDashOffset,
                    alpha: style.alpha,
                },
                style.stroke,
            );
            context.stroke();
        }

        context.restore();
    }

    rectangle(
        x: number,
        y: number,
        width: number,
        height: number,
        style: FillStyle = {},
    ) {
        const context = this.rawContext;

        context.save();
        context.globalAlpha =
            style.alpha ?? 1;

        if (style.fill !== "none") {
            context.fillStyle =
                style.fill ??
                this.palette.accent;
            context.fillRect(
                x,
                y,
                width,
                height,
            );
        }

        if (style.stroke) {
            applyStrokeStyle(
                context,
                {
                    color: style.stroke,
                    width:
                        style.strokeWidth ?? 1,
                    pattern:
                        style.strokePattern,
                    dashOffset:
                        style.strokeDashOffset,
                    alpha: style.alpha,
                },
                style.stroke,
            );
            context.strokeRect(
                x,
                y,
                width,
                height,
            );
        }

        context.restore();
    }

    arrow(
        from: ScreenPoint,
        to: ScreenPoint,
        style: StrokeStyle & {
            headSize?: number;
        } = {},
    ) {
        const context = this.rawContext;
        const color =
            style.color ??
            this.palette.accent;

        const headSize =
            style.headSize ?? 8;

        const angle = Math.atan2(
            to.y - from.y,
            to.x - from.x,
        );

        context.save();
        applyStrokeStyle(
            context,
            {
                ...style,
                color,
            },
            color,
        );

        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();

        context.fillStyle = color;
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
            to.x -
                headSize *
                    Math.cos(
                        angle - Math.PI / 6,
                    ),
            to.y -
                headSize *
                    Math.sin(
                        angle - Math.PI / 6,
                    ),
        );
        context.lineTo(
            to.x -
                headSize *
                    Math.cos(
                        angle + Math.PI / 6,
                    ),
            to.y -
                headSize *
                    Math.sin(
                        angle + Math.PI / 6,
                    ),
        );
        context.closePath();
        context.fill();
        context.restore();
    }

    text(options: TextOptions) {
        const context = this.rawContext;

        context.save();
        context.translate(
            options.x,
            options.y,
        );
        context.rotate(
            options.rotation ?? 0,
        );
        context.fillStyle =
            options.color ??
            this.palette.foreground;
        context.font = createFont(
            options.size ?? 13,
            options.weight ?? 500,
            options.italic ?? false,
        );
        context.textAlign =
            options.align ?? "left";
        context.textBaseline =
            options.baseline ?? "alphabetic";
        context.fillText(
            options.text,
            0,
            0,
        );
        context.restore();
    }

    richText(options: RichTextOptions) {
        const context = this.rawContext;
        const size = options.size ?? 13;
        const defaultWeight =
            options.weight ?? 500;

        context.save();
        context.translate(
            options.x,
            options.y,
        );
        context.rotate(
            options.rotation ?? 0,
        );
        context.fillStyle =
            options.color ??
            this.palette.foreground;
        context.textAlign = "left";
        context.textBaseline =
            options.baseline ?? "alphabetic";

        const widths = options.runs.map(
            (run) => {
                context.font = createFont(
                    size,
                    run.weight ??
                        defaultWeight,
                    run.italic ?? false,
                );
                return context.measureText(
                    run.text,
                ).width;
            },
        );

        const totalWidth = widths.reduce(
            (sum, width) => sum + width,
            0,
        );

        let x = alignmentOffset(
            options.align ?? "left",
            totalWidth,
        );

        options.runs.forEach(
            (run, index) => {
                context.font = createFont(
                    size,
                    run.weight ??
                        defaultWeight,
                    run.italic ?? false,
                );
                context.fillText(
                    run.text,
                    x,
                    0,
                );
                x += widths[index];
            },
        );

        context.restore();
    }

    grid(
        viewport: Viewport2D,
        options: GridOptions = {},
    ) {
        const drawX = options.x ?? true;
        const drawY = options.y ?? true;

        const xStep =
            options.xStep ??
            chooseGridStep(
                viewport.xMax - viewport.xMin,
            );

        const yStep =
            options.yStep ??
            chooseGridStep(
                viewport.yMax - viewport.yMin,
            );

        const baseStroke: StrokeStyle = {
            color: this.palette.grid,
            width: 1,
            ...options.stroke,
        };

        if (drawX) {
            const stroke = {
                ...baseStroke,
                ...options.xStroke,
            };

            for (
                let x = firstGridValue(
                    viewport.xMin,
                    xStep,
                );
                x <= viewport.xMax +
                    xStep * 1e-9;
                x += xStep
            ) {
                this.line(
                    viewport.point(
                        x,
                        viewport.yMin,
                    ),
                    viewport.point(
                        x,
                        viewport.yMax,
                    ),
                    stroke,
                );
            }
        }

        if (drawY) {
            const stroke = {
                ...baseStroke,
                ...options.yStroke,
            };

            for (
                let y = firstGridValue(
                    viewport.yMin,
                    yStep,
                );
                y <= viewport.yMax +
                    yStep * 1e-9;
                y += yStep
            ) {
                this.line(
                    viewport.point(
                        viewport.xMin,
                        y,
                    ),
                    viewport.point(
                        viewport.xMax,
                        y,
                    ),
                    stroke,
                );
            }
        }
    }

    functionGraph(
        viewport: Viewport2D,
        evaluate: (value: number) => number,
        options: FunctionGraphOptions = {},
    ) {
        const domainMinimum = Math.max(
            viewport.xMin,
            options.domain?.min ??
                viewport.xMin,
        );

        const domainMaximum = Math.min(
            viewport.xMax,
            options.domain?.max ??
                viewport.xMax,
        );

        this.parametricGraph(
            viewport,
            (value) => ({
                x: value,
                y: evaluate(value),
            }),
            {
                ...options,
                domain: {
                    min: domainMinimum,
                    max: domainMaximum,
                },
            },
        );
    }

    parametricGraph(
        viewport: Viewport2D,
        evaluate: (
            value: number,
        ) => ScreenPoint | undefined,
        options: ParametricGraphOptions,
    ) {
        const domainMinimum =
            options.domain.min;
        const domainMaximum =
            options.domain.max;

        if (
            !Number.isFinite(domainMinimum) ||
            !Number.isFinite(domainMaximum) ||
            domainMaximum <= domainMinimum
        ) {
            return;
        }

        const sampleCount = Math.round(
            clamp(
                options.samples ??
                    Math.max(
                        160,
                        this.width * 1.5,
                    ),
                32,
                4096,
            ),
        );

        const color = resolvePaletteColor(
            options.color,
            this.palette,
            this.palette.secondary,
        );

        const context = this.rawContext;
        const jumpLimit =
            viewport.height * 1.5;

        context.save();
        clipToViewport(
            context,
            viewport,
        );

        applyStrokeStyle(
            context,
            {
                color,
                width: options.width ?? 2.25,
                pattern: options.pattern,
                alpha: options.alpha,
            },
            color,
        );

        context.beginPath();
        let hasCurrentSegment = false;
        let previousScreenPoint:
            ScreenPoint | undefined;

        for (
            let index = 0;
            index <= sampleCount;
            index++
        ) {
            const value =
                domainMinimum +
                (index / sampleCount) *
                    (domainMaximum -
                        domainMinimum);

            let worldPoint:
                ScreenPoint | undefined;

            try {
                worldPoint = evaluate(value);
            } catch {
                worldPoint = undefined;
            }

            if (
                !worldPoint ||
                !Number.isFinite(worldPoint.x) ||
                !Number.isFinite(worldPoint.y)
            ) {
                hasCurrentSegment = false;
                previousScreenPoint = undefined;
                continue;
            }

            const screenPoint =
                viewport.point(
                    worldPoint.x,
                    worldPoint.y,
                );

            if (
                previousScreenPoint &&
                Math.hypot(
                    screenPoint.x -
                        previousScreenPoint.x,
                    screenPoint.y -
                        previousScreenPoint.y,
                ) > jumpLimit
            ) {
                hasCurrentSegment = false;
            }

            if (!hasCurrentSegment) {
                context.moveTo(
                    screenPoint.x,
                    screenPoint.y,
                );
                hasCurrentSegment = true;
            } else {
                context.lineTo(
                    screenPoint.x,
                    screenPoint.y,
                );
            }

            previousScreenPoint =
                screenPoint;
        }

        context.stroke();
        context.restore();
    }

    axes(
        viewport: Viewport2D,
        options: AxesOptions = {},
    ) {
        const usesExplicitAxes =
            Object.prototype.hasOwnProperty.call(
                options,
                "x",
            ) ||
            Object.prototype.hasOwnProperty.call(
                options,
                "y",
            );

        const xAxis = usesExplicitAxes
            ? options.x
            : {
                  label: options.xLabel,
              };

        const yAxis = usesExplicitAxes
            ? options.y
            : {
                  label: options.yLabel,
              };

        const plotLeft = viewport.padding;
        const plotRight =
            viewport.width - viewport.padding;
        const plotTop = viewport.padding;
        const plotBottom =
            viewport.height - viewport.padding;

        const xAxisY = clamp(
            viewport.y(0),
            plotTop,
            plotBottom,
        );

        const yAxisX = clamp(
            viewport.x(0),
            plotLeft,
            plotRight,
        );

        if (xAxis !== false && xAxis) {
            this.line(
                {
                    x: plotLeft,
                    y: xAxisY,
                },
                {
                    x: plotRight,
                    y: xAxisY,
                },
                {
                    color: this.palette.muted,
                    width: 1.25,
                    ...xAxis.stroke,
                },
            );

            const direction =
                chooseXAxisOutsideDirection(
                    xAxisY,
                    plotTop,
                    plotBottom,
                );

            const tickExtent =
                this.drawXAxisTicks(
                    viewport,
                    xAxisY,
                    direction,
                    xAxis,
                );

            const label =
                completeAxisLabel(xAxis);

            if (label) {
                const outward =
                    tickExtent + 10;

                this.richText({
                    x: plotRight,
                    y:
                        xAxisY +
                        direction * outward,
                    runs: createAxisLabelRuns(
                        label,
                        xAxis.labelStyle ??
                            "auto",
                    ),
                    color: this.palette.muted,
                    align: "right",
                    baseline:
                        direction > 0
                            ? "top"
                            : "bottom",
                });
            }
        }

        if (yAxis !== false && yAxis) {
            this.line(
                {
                    x: yAxisX,
                    y: plotTop,
                },
                {
                    x: yAxisX,
                    y: plotBottom,
                },
                {
                    color: this.palette.muted,
                    width: 1.25,
                    ...yAxis.stroke,
                },
            );

            const direction =
                chooseYAxisOutsideDirection(
                    yAxisX,
                    plotLeft,
                    plotRight,
                );

            const tickExtent =
                this.drawYAxisTicks(
                    viewport,
                    yAxisX,
                    direction,
                    yAxis,
                    Boolean(
                        xAxis !== false &&
                        xAxis?.ticks,
                    ),
                );

            const label =
                completeAxisLabel(yAxis);

            if (label) {
                this.richText({
                    x:
                        yAxisX +
                        direction *
                            (tickExtent + 12),
                    y:
                        (plotTop +
                            plotBottom) /
                        2,
                    runs: createAxisLabelRuns(
                        label,
                        yAxis.labelStyle ??
                            "auto",
                    ),
                    color: this.palette.muted,
                    align: "center",
                    baseline: "middle",
                    rotation:
                        direction < 0
                            ? -Math.PI / 2
                            : Math.PI / 2,
                });
            }
        }
    }

    private drawXAxisTicks(
        viewport: Viewport2D,
        axisY: number,
        direction: -1 | 1,
        axis: SimulationAxisDefinition,
    ): number {
        if (!axis.ticks) {
            return 0;
        }

        const options =
            typeof axis.ticks === "object"
                ? axis.ticks
                : {};

        const step =
            options.step ??
            chooseGridStep(
                viewport.xMax -
                    viewport.xMin,
            );

        if (
            !Number.isFinite(step) ||
            step <= 0
        ) {
            return 0;
        }

        const tickSize =
            options.size ?? 4;
        const labelGap = 4;
        const labelSize = 11;
        const unit =
            options.unit ?? axis.unit;

        for (
            let value = firstGridValue(
                viewport.xMin,
                step,
            );
            value <= viewport.xMax +
                step * 1e-9;
            value += step
        ) {
            const x = viewport.x(value);

            this.line(
                {
                    x,
                    y: axisY,
                },
                {
                    x,
                    y:
                        axisY +
                        direction * tickSize,
                },
                {
                    color: this.palette.muted,
                    width: 1,
                    ...options.stroke,
                },
            );

            this.text({
                x,
                y:
                    axisY +
                    direction *
                        (tickSize + labelGap),
                text: formatTickValue(
                    value,
                    step,
                    unit,
                    options.decimals,
                    options.showUnit,
                ),
                color: this.palette.muted,
                size: labelSize,
                align: "center",
                baseline:
                    direction > 0
                        ? "top"
                        : "bottom",
            });
        }

        return tickSize +
            labelGap +
            labelSize;
    }

    private drawYAxisTicks(
        viewport: Viewport2D,
        axisX: number,
        direction: -1 | 1,
        axis: SimulationAxisDefinition,
        skipZero: boolean,
    ): number {
        if (!axis.ticks) {
            return 0;
        }

        const options =
            typeof axis.ticks === "object"
                ? axis.ticks
                : {};

        const step =
            options.step ??
            chooseGridStep(
                viewport.yMax -
                    viewport.yMin,
            );

        if (
            !Number.isFinite(step) ||
            step <= 0
        ) {
            return 0;
        }

        const tickSize =
            options.size ?? 4;
        const labelGap = 5;
        const unit =
            options.unit ?? axis.unit;
        let maximumLabelWidth = 0;

        for (
            let value = firstGridValue(
                viewport.yMin,
                step,
            );
            value <= viewport.yMax +
                step * 1e-9;
            value += step
        ) {
            if (
                skipZero &&
                Math.abs(value) <
                    step * 1e-9
            ) {
                continue;
            }

            const y = viewport.y(value);
            const text = formatTickValue(
                value,
                step,
                unit,
                options.decimals,
                options.showUnit,
            );

            this.line(
                {
                    x: axisX,
                    y,
                },
                {
                    x:
                        axisX +
                        direction * tickSize,
                    y,
                },
                {
                    color: this.palette.muted,
                    width: 1,
                    ...options.stroke,
                },
            );

            this.text({
                x:
                    axisX +
                    direction *
                        (tickSize + labelGap),
                y,
                text,
                color: this.palette.muted,
                size: 11,
                align:
                    direction < 0
                        ? "right"
                        : "left",
                baseline: "middle",
            });

            maximumLabelWidth = Math.max(
                maximumLabelWidth,
                this.measureText(text, 11),
            );
        }

        return tickSize +
            labelGap +
            maximumLabelWidth;
    }

    private measureText(
        text: string,
        size: number,
    ): number {
        const context = this.rawContext;

        context.save();
        context.font = createFont(
            size,
            500,
            false,
        );
        const width =
            context.measureText(text).width;
        context.restore();

        return width;
    }
}

function chooseXAxisOutsideDirection(
    axisY: number,
    plotTop: number,
    plotBottom: number,
): -1 | 1 {
    const tolerance = 0.5;

    if (
        Math.abs(axisY - plotTop) <=
        tolerance
    ) {
        return -1;
    }

    if (
        Math.abs(axisY - plotBottom) <=
        tolerance
    ) {
        return 1;
    }

    const spaceAbove = axisY - plotTop;
    const spaceBelow = plotBottom - axisY;

    return spaceBelow >= spaceAbove
        ? 1
        : -1;
}

function chooseYAxisOutsideDirection(
    axisX: number,
    plotLeft: number,
    plotRight: number,
): -1 | 1 {
    const tolerance = 0.5;

    if (
        Math.abs(axisX - plotLeft) <=
        tolerance
    ) {
        return -1;
    }

    if (
        Math.abs(axisX - plotRight) <=
        tolerance
    ) {
        return 1;
    }

    const spaceLeft = axisX - plotLeft;
    const spaceRight = plotRight - axisX;

    return spaceLeft >= spaceRight
        ? -1
        : 1;
}

function completeAxisLabel(
    axis: SimulationAxisDefinition,
): string | undefined {
    if (axis.label && axis.unit) {
        return axis.label.includes("/")
            ? axis.label
            : `${axis.label}/${axis.unit}`;
    }

    return axis.label ?? axis.unit;
}

function createAxisLabelRuns(
    label: string,
    style: SimulationAxisLabelStyle,
): RichTextRun[] {
    const explicitRuns =
        parseExplicitItalicRuns(label);

    if (explicitRuns) {
        return explicitRuns;
    }

    const shouldUseMath =
        style === "math" ||
        (style === "auto" &&
            looksLikeVariableUnitLabel(label));

    if (!shouldUseMath) {
        return [{ text: label }];
    }

    const slashIndex = label.indexOf("/");

    if (slashIndex === -1) {
        return [
            {
                text: label,
                italic: true,
            },
        ];
    }

    return [
        {
            text: label.slice(
                0,
                slashIndex,
            ),
            italic: true,
        },
        {
            text: label.slice(slashIndex),
        },
    ];
}

function parseExplicitItalicRuns(
    label: string,
): RichTextRun[] | undefined {
    if (!label.includes("*")) {
        return undefined;
    }

    const runs: RichTextRun[] = [];
    let current = "";
    let italic = false;

    for (const character of label) {
        if (character === "*") {
            if (current) {
                runs.push({
                    text: current,
                    italic,
                });
                current = "";
            }
            italic = !italic;
            continue;
        }

        current += character;
    }

    if (current) {
        runs.push({
            text: current,
            italic,
        });
    }

    return runs.length > 0
        ? runs
        : undefined;
}

function looksLikeVariableUnitLabel(
    label: string,
): boolean {
    return /^[A-Za-zΑ-Ωα-ω][A-Za-z0-9_₀-₉]*\/.+$/u.test(
        label,
    );
}

function formatTickValue(
    value: number,
    step: number,
    unit: string | undefined,
    explicitDecimals: number | undefined,
    showUnit: boolean | undefined,
): string {
    const decimals =
        explicitDecimals ??
        inferDecimals(step);

    const normalizedValue =
        Math.abs(value) <
        Math.abs(step) * 1e-9
            ? 0
            : value;

    const formatted =
        normalizedValue.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 0,
                maximumFractionDigits:
                    decimals,
            },
        );

    return showUnit && unit
        ? `${formatted} ${unit}`
        : formatted;
}

function inferDecimals(step: number): number {
    const absoluteStep = Math.abs(step);

    if (absoluteStep >= 1) {
        return 0;
    }

    return Math.min(
        6,
        Math.max(
            0,
            Math.ceil(
                -Math.log10(absoluteStep),
            ),
        ),
    );
}

function resolvePaletteColor(
    color:
        | keyof SimulationPalette
        | string
        | undefined,
    palette: SimulationPalette,
    fallback: string,
): string {
    if (!color) {
        return fallback;
    }

    if (color in palette) {
        return palette[
            color as keyof SimulationPalette
        ];
    }

    return color;
}

function applyStrokeStyle(
    context: CanvasRenderingContext2D,
    style: StrokeStyle,
    defaultColor: string,
) {
    context.strokeStyle =
        style.color ?? defaultColor;
    context.lineWidth =
        style.width ?? 1.5;
    context.globalAlpha =
        style.alpha ?? 1;
    context.lineDashOffset =
        style.dashOffset ?? 0;
    context.setLineDash(
        resolveDashPattern(
            style.pattern,
            style.dash,
        ),
    );
    context.lineCap = "round";
    context.lineJoin = "round";
}

function resolveDashPattern(
    pattern: SimulationStrokePattern | undefined,
    legacyDash: readonly number[] | undefined,
): number[] {
    if (legacyDash) {
        return [...legacyDash];
    }

    if (Array.isArray(pattern)) {
        return [...pattern];
    }

    switch (pattern) {
        case "dashed":
            return [8, 6];
        case "dotted":
            return [1, 5];
        case "solid":
        case undefined:
            return [];
        default:
            return [];
    }
}

function clipToViewport(
    context: CanvasRenderingContext2D,
    viewport: Viewport2D,
) {
    context.beginPath();
    context.rect(
        viewport.padding,
        viewport.padding,
        Math.max(
            0,
            viewport.width -
                viewport.padding * 2,
        ),
        Math.max(
            0,
            viewport.height -
                viewport.padding * 2,
        ),
    );
    context.clip();
}

function chooseGridStep(
    range: number,
): number {
    const roughStep = Math.abs(range) / 10;

    if (
        !Number.isFinite(roughStep) ||
        roughStep <= 0
    ) {
        return 1;
    }

    const power = Math.pow(
        10,
        Math.floor(
            Math.log10(roughStep),
        ),
    );

    const normalized = roughStep / power;

    const multiplier =
        normalized < 2
            ? 1
            : normalized < 5
              ? 2
              : 5;

    return multiplier * power;
}

function firstGridValue(
    minimum: number,
    step: number,
): number {
    return Math.ceil(minimum / step) * step;
}

function createFont(
    size: number,
    weight: number,
    italic: boolean,
): string {
    return `${italic ? "italic " : ""}${weight} ${size}px Inter, Arial, sans-serif`;
}

function alignmentOffset(
    align: CanvasTextAlign,
    width: number,
): number {
    switch (align) {
        case "center":
            return -width / 2;
        case "right":
        case "end":
            return -width;
        default:
            return 0;
    }
}

function clamp(
    value: number,
    minimum: number,
    maximum: number,
): number {
    return Math.min(
        maximum,
        Math.max(minimum, value),
    );
}
