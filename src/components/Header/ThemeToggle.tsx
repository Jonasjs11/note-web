import { useTheme } from "../../app/ThemeContext";
import { useUiTranslation } from "../../i18n/useUiTranslation";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const t = useUiTranslation();
    const label = theme === "dark" ? t("theme.toLight") : t("theme.toDark");
    return (
        <button type="button" className="theme-toggle" aria-label={label}
            title={label} onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
