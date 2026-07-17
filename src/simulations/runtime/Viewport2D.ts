import type {
    WorldBounds,
} from "./simulationTypes";

export interface ScreenPoint {
    x: number;
    y: number;
}

export class Viewport2D {
    readonly width: number;
    readonly height: number;

    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;

    readonly padding: number;

    private readonly drawableWidth: number;
    private readonly drawableHeight: number;

    constructor(
        width: number,
        height: number,
        bounds: WorldBounds,
    ) {
        this.width = width;
        this.height = height;

        this.xMin = bounds.xMin;
        this.xMax = bounds.xMax;
        this.yMin = bounds.yMin;
        this.yMax = bounds.yMax;

        this.padding = Math.max(
            0,
            bounds.padding ?? 28,
        );

        this.drawableWidth = Math.max(
            1,
            width - this.padding * 2,
        );

        this.drawableHeight = Math.max(
            1,
            height - this.padding * 2,
        );
    }

    x(value: number): number {
        const range = this.xMax - this.xMin;

        if (range === 0) {
            return this.width / 2;
        }

        return (
            this.padding +
            ((value - this.xMin) / range) *
                this.drawableWidth
        );
    }

    y(value: number): number {
        const range = this.yMax - this.yMin;

        if (range === 0) {
            return this.height / 2;
        }

        return (
            this.height -
            this.padding -
            ((value - this.yMin) / range) *
                this.drawableHeight
        );
    }

    point(
        x: number,
        y: number,
    ): ScreenPoint {
        return {
            x: this.x(x),
            y: this.y(y),
        };
    }

    lengthX(value: number): number {
        const range = this.xMax - this.xMin;

        if (range === 0) {
            return 0;
        }

        return (
            value / range *
            this.drawableWidth
        );
    }

    lengthY(value: number): number {
        const range = this.yMax - this.yMin;

        if (range === 0) {
            return 0;
        }

        return (
            value / range *
            this.drawableHeight
        );
    }
}
