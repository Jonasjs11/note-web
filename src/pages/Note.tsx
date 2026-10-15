import { useEffect } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { notes } from "../content/loader/loadNotes";
import type { Diagnostic } from "../content/models/Diagnostic";
import MarkdownRenderer from "../components/Markdown/MarkdownView";
import type { LayoutOutletContext } from "../app/Layout";
import { useUiTranslation } from "../i18n/useUiTranslation";

export default function Note() {
    const t = useUiTranslation();
    const location = useLocation();
    const pathname = decodeURI(location.pathname).normalize("NFC");
    const note = notes.find(candidate => candidate.url.normalize("NFC") === pathname);
    const { setSiteContentsSections } = useOutletContext<LayoutOutletContext>();
    useEffect(() => {
        setSiteContentsSections(note?.sections ?? []);
        return () => { setSiteContentsSections([]); };
    }, [note?.sections, setSiteContentsSections]);

    if (!note) return (
        <>
            <h1>{t("page.notFound")}</h1>
            <p>{t("page.missingAt", { path: location.pathname })}</p>
        </>
    );
    const errors = note.diagnostics.filter(diagnostic => diagnostic.severity === "error");
    const warnings = note.diagnostics.filter(diagnostic => diagnostic.severity === "warning");
    if (errors.length) return (
        <>
            <h1>{t("page.invalid")}</h1>
            <p>{t("page.invalidExplanation")}</p>
            <DiagnosticList title={t("diagnostics.errors")} diagnostics={errors} />
            {warnings.length > 0 && <DiagnosticList title={t("diagnostics.warnings")} diagnostics={warnings} />}
        </>
    );
    return (
        <>
            {warnings.length > 0 && <DiagnosticList title={t("diagnostics.warnings")} diagnostics={warnings} />}
            <MarkdownRenderer key={note.url} source={note.transformedSource} />
        </>
    );
}
function DiagnosticList({ title, diagnostics }: { title: string; diagnostics: Diagnostic[] }) {
    const t = useUiTranslation();
    return (
        <section>
            <h2>{title}</h2>
            <ul>
                {diagnostics.map((diagnostic, index) => (
                    <li key={index}>
                        <strong>{diagnostic.filePath}</strong>
                        {diagnostic.location && (
                            <>
                                {` — ${t("diagnostics.line")} ${diagnostic.location.line}, ${t("diagnostics.column")} ${diagnostic.location.column}`}
                            </>
                        )}
                        {": "}{diagnostic.message}
                    </li>
                ))}
            </ul>
        </section>
    );
}
