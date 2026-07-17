import type {
    ScreenPoint,
} from "./Viewport2D";

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

interface StrokeStyle {
    color?: string;
    width?: number;
    dash?: readonly number[];
    alpha?: number;
}

interface FillStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
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
            context.strokeStyle =
                style.stroke;
            context.lineWidth =
                style.strokeWidth ?? 1;
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
            context.strokeStyle =
                style.stroke;
            context.lineWidth =
                style.strokeWidth ?? 1;
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
        context.fillStyle =
            options.color ??
            this.palette.foreground;
        context.font = `${options.weight ?? 500} ${options.size ?? 13}px Inter, Arial, sans-serif`;
        context.textAlign =
            options.align ?? "left";
        context.textBaseline =
            options.baseline ?? "alphabetic";
        context.fillText(
            options.text,
            options.x,
            options.y,
        );
        context.restore();
    }

    grid(
        viewport: Viewport2D,
        options: {
            xStep?: number;
            yStep?: number;
            color?: string;
            width?: number;
        } = {},
    ) {
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

        const style = {
            color:
                options.color ??
                this.palette.grid,
            width: options.width ?? 1,
        };

        for (
            let x = firstGridValue(
                viewport.xMin,
                xStep,
            );
            x <= viewport.xMax;
            x += xStep
        ) {
            this.line(
                {
                    x: viewport.x(x),
                    y: viewport.y(
                        viewport.yMin,
                    ),
                },
                {
                    x: viewport.x(x),
                    y: viewport.y(
                        viewport.yMax,
                    ),
                },
                style,
            );
        }

        for (
            let y = firstGridValue(
                viewport.yMin,
                yStep,
            );
            y <= viewport.yMax;
            y += yStep
        ) {
            this.line(
                {
                    x: viewport.x(
                        viewport.xMin,
                    ),
                    y: viewport.y(y),
                },
                {
                    x: viewport.x(
                        viewport.xMax,
                    ),
                    y: viewport.y(y),
                },
                style,
            );
        }
    }

    axes(
        viewport: Viewport2D,
        options: {
            xLabel?: string;
            yLabel?: string;
        } = {},
    ) {
        const xAxisY = clamp(
            viewport.y(0),
            viewport.padding,
            viewport.height -
                viewport.padding,
        );

        const yAxisX = clamp(
            viewport.x(0),
            viewport.padding,
            viewport.width -
                viewport.padding,
        );

        this.line(
            {
                x: viewport.padding,
                y: xAxisY,
            },
            {
                x:
                    viewport.width -
                    viewport.padding,
                y: xAxisY,
            },
            {
                color:
                    this.palette.muted,
                width: 1.25,
            },
        );

        this.line(
            {
                x: yAxisX,
                y: viewport.padding,
            },
            {
                x: yAxisX,
                y:
                    viewport.height -
                    viewport.padding,
            },
            {
                color:
                    this.palette.muted,
                width: 1.25,
            },
        );

        if (options.xLabel) {
            this.text({
                x:
                    viewport.width -
                    viewport.padding,
                y: xAxisY - 8,
                text: options.xLabel,
                color:
                    this.palette.muted,
                align: "right",
            });
        }

        if (options.yLabel) {
            this.text({
                x: yAxisX + 8,
                y: viewport.padding,
                text: options.yLabel,
                color:
                    this.palette.muted,
                baseline: "top",
            });
        }
    }
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
    context.setLineDash(
        style.dash
            ? [...style.dash]
            : [],
    );
    context.lineCap = "round";
    context.lineJoin = "round";
}

function chooseGridStep(
    range: number,
): number {
    const roughStep = Math.abs(range) / 10;

    if (!Number.isFinite(roughStep) || roughStep <= 0) {
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
