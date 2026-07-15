export {};

declare global {
    interface Window {
        MathJax?: {
            typesetPromise?: (
                elements?: HTMLElement[],
            ) => Promise<void>;

            typesetClear?: (
                elements?: HTMLElement[],
            ) => void;

            texReset?: (
                startNumber?: number,
            ) => void;

            startup?: {
                promise?: Promise<void>;
            };

            tex?: {
                inlineMath?: string[][];
                displayMath?: string[][];
                tags?: string;
            };

            svg?: {
                fontCache?: string;
            };
        };
    }
}