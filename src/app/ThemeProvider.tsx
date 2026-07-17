import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    ReactNode,
} from "react";

import {
    ThemeContext,
} from "./ThemeContext";

import {
    applyResolvedTheme,
    readStoredThemePreference,
    readSystemTheme,
    writeStoredThemePreference,
} from "./theme";

import type {
    ResolvedTheme,
    ThemePreference,
} from "./theme";

interface ThemeProviderProps {
    children: ReactNode;
}

export default function ThemeProvider({
    children,
}: ThemeProviderProps) {
    const [preference, setPreference] =
        useState<ThemePreference>(() => {
            return readStoredThemePreference();
        });

    const [systemTheme, setSystemTheme] =
        useState<ResolvedTheme>(() => {
            return readSystemTheme();
        });

    const theme =
        preference === "system"
            ? systemTheme
            : preference;

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-color-scheme: dark)",
        );

        function handleSystemThemeChange() {
            setSystemTheme(
                mediaQuery.matches
                    ? "dark"
                    : "light",
            );
        }

        mediaQuery.addEventListener(
            "change",
            handleSystemThemeChange,
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleSystemThemeChange,
            );
        };
    }, []);

    useEffect(() => {
        applyResolvedTheme(theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const nextTheme: ResolvedTheme =
            theme === "dark"
                ? "light"
                : "dark";

        setPreference(nextTheme);
        writeStoredThemePreference(nextTheme);
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            toggleTheme,
        }),
        [theme, toggleTheme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
