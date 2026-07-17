export type ResolvedTheme =
    | "light"
    | "dark";

export type ThemePreference =
    | ResolvedTheme
    | "system";

const THEME_STORAGE_KEY =
    "note-web:theme";

export function initializeTheme(): void {
    applyResolvedTheme(
        resolveTheme(
            readStoredThemePreference(),
        ),
    );
}

export function readStoredThemePreference():
    ThemePreference {
    try {
        const stored = localStorage.getItem(
            THEME_STORAGE_KEY,
        );

        if (
            stored === "light" ||
            stored === "dark"
        ) {
            return stored;
        }
    } catch {
        // Storage may be unavailable in privacy modes.
    }

    return "system";
}

export function writeStoredThemePreference(
    preference: ResolvedTheme,
): void {
    try {
        localStorage.setItem(
            THEME_STORAGE_KEY,
            preference,
        );
    } catch {
        // The selected theme still works for this session.
    }
}

export function resolveTheme(
    preference: ThemePreference,
): ResolvedTheme {
    return preference === "system"
        ? readSystemTheme()
        : preference;
}

export function readSystemTheme():
    ResolvedTheme {
    return window.matchMedia(
        "(prefers-color-scheme: dark)",
    ).matches
        ? "dark"
        : "light";
}

export function applyResolvedTheme(
    theme: ResolvedTheme,
): void {
    document.documentElement.dataset.theme =
        theme;

    document.documentElement.style.colorScheme =
        theme;

    window.dispatchEvent(
        new Event("note-web:theme-change"),
    );
}
