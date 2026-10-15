import { useUiTranslation } from "../i18n/useUiTranslation";
export default function Home() {
    const t = useUiTranslation();
    return <><h1>{t("home.title")}</h1><p>{t("home.welcome")}</p></>;
}
