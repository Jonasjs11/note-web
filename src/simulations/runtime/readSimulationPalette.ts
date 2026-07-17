import type {
    SimulationPalette,
} from "./CanvasGraphics";

const fallbackPalette:
    SimulationPalette = {
        background: "#17191f",
        foreground: "#f4f4f5",
        muted: "#a1a1aa",
        grid: "rgba(255, 255, 255, 0.08)",
        accent: "#78a9ff",
        secondary: "#a78bfa",
        danger: "#fb7185",
    };

export function readSimulationPalette(
    element: HTMLElement,
): SimulationPalette {
    const styles = getComputedStyle(element);

    return {
        background: readVariable(
            styles,
            "--simulation-background",
            fallbackPalette.background,
        ),
        foreground: readVariable(
            styles,
            "--simulation-foreground",
            fallbackPalette.foreground,
        ),
        muted: readVariable(
            styles,
            "--simulation-muted",
            fallbackPalette.muted,
        ),
        grid: readVariable(
            styles,
            "--simulation-grid",
            fallbackPalette.grid,
        ),
        accent: readVariable(
            styles,
            "--simulation-accent",
            fallbackPalette.accent,
        ),
        secondary: readVariable(
            styles,
            "--simulation-secondary",
            fallbackPalette.secondary,
        ),
        danger: readVariable(
            styles,
            "--simulation-danger",
            fallbackPalette.danger,
        ),
    };
}

function readVariable(
    styles: CSSStyleDeclaration,
    name: string,
    fallback: string,
): string {
    return (
        styles
            .getPropertyValue(name)
            .trim() || fallback
    );
}
