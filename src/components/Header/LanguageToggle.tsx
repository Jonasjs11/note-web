import {
    useLanguage,
} from "../../app/LanguageContext";

import {
    CONTENT_LANGUAGES,
} from "../../i18n/contentLanguage";

import type {
    ContentLanguage,
} from "../../i18n/contentLanguage";

import "./LanguageToggle.css";

interface LanguageToggleProps {
    variant?: "header" | "tooltip";
}

const languageNames:
    Record<ContentLanguage, string> = {
        en: "English",
        da: "Dansk",
    };

export default function LanguageToggle({
    variant = "header",
}: LanguageToggleProps) {
    const {
        language,
        setLanguage,
    } = useLanguage();

    return (
        <div
            className={
                `language-toggle language-toggle--${variant}`
            }
            role="group"
            aria-label="Content language"
        >
            {CONTENT_LANGUAGES.map(
                (candidate) => {
                    const isSelected =
                        candidate === language;

                    return (
                        <button
                            key={candidate}
                            type="button"
                            className={
                                isSelected
                                    ? "language-toggle__button language-toggle__button--selected"
                                    : "language-toggle__button"
                            }
                            aria-pressed={isSelected}
                            aria-label={
                                `Use ${languageNames[candidate]} for translated content`
                            }
                            title={
                                languageNames[candidate]
                            }
                            onClick={() => {
                                setLanguage(candidate);
                            }}
                        >
                            {candidate.toUpperCase()}
                        </button>
                    );
                },
            )}
        </div>
    );
}
