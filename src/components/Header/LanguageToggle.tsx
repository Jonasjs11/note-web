import { useLanguage } from "../../app/LanguageContext";
import { CONTENT_LANGUAGES } from "../../i18n/contentLanguage";
import type { ContentLanguage } from "../../i18n/contentLanguage";
import { useUiTranslation } from "../../i18n/useUiTranslation";
import "./LanguageToggle.css";

interface LanguageToggleProps { variant?: "header" | "tooltip"; }
const languageNames: Record<ContentLanguage, string> = {
    en: "English", da: "Dansk",
};
export default function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
    const { language, setLanguage } = useLanguage();
    const t = useUiTranslation();
    return (
        <div className={`language-toggle language-toggle--${variant}`}
            role="group" aria-label={t("language.group")}>
            {CONTENT_LANGUAGES.map(candidate => (
                <button key={candidate} type="button"
                    className={candidate === language
                        ? "language-toggle__button language-toggle__button--selected"
                        : "language-toggle__button"}
                    aria-pressed={candidate === language}
                    aria-label={t("language.use", { language: languageNames[candidate] })}
                    title={languageNames[candidate]}
                    onClick={() => setLanguage(candidate)}>
                    {candidate.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
