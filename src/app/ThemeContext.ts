import {
    createContext,
    useContext,
} from "react";

import type {
    ResolvedTheme,
} from "./theme";

export interface ThemeContextValue {
    theme: ResolvedTheme;
    toggleTheme: () => void;
}

export const ThemeContext =
    createContext<ThemeContextValue | undefined>(
        undefined,
    );

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider.",
        );
    }

    return context;
}
