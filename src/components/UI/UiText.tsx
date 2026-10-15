import { useUiTranslation } from "../../i18n/useUiTranslation";
import type { UiTranslationKey } from "../../i18n/uiTranslations";

/** For static text in command renderers; no hooks inside renderer.render(). */
export default function UiText({
    id,
    values,
}: {
    id: UiTranslationKey;
    values?: Record<string, string | number>;
}) {
    const t = useUiTranslation();
    return <>{t(id, values)}</>;
}
