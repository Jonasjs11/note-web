import { useLocation } from "react-router-dom";

import { notes } from "../content/loader/loadNotes";

import type { Diagnostic } from "../content/models/Diagnostic";

import MarkdownRenderer from "../components/Markdown/MarkdownRenderer";

export default function Note() {
    const location = useLocation();

    const note = notes.find((candidate) => {
        return candidate.url === location.pathname;
    });

    if (!note) {
        return (
            <>
                <h1>Note not found</h1>

                <p>
                    No note exists at{" "}
                    <code>{location.pathname}</code>.
                </p>
            </>
        );
    }

    const errors = note.diagnostics.filter(
        diagnostic => diagnostic.severity === "error",
    );

    const warnings = note.diagnostics.filter(
        diagnostic => diagnostic.severity === "warning",
    );

    if (errors.length > 0) {
        return (
            <>
                <h1>Invalid note</h1>

                <p>
                    This note contains errors and cannot be
                    rendered.
                </p>

                <DiagnosticList
                    title="Errors"
                    diagnostics={errors}
                />

                {warnings.length > 0 && (
                    <DiagnosticList
                        title="Warnings"
                        diagnostics={warnings}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {warnings.length > 0 && (
                <DiagnosticList
                    title="Warnings"
                    diagnostics={warnings}
                />
            )}

            <MarkdownRenderer source={note.source} />
        </>
    );
}

function DiagnosticList({
    title,
    diagnostics,
}: {
    title: string;
    diagnostics: Diagnostic[];
}) {
    return (
        <section>
            <h2>{title}</h2>

            <ul>
                {diagnostics.map(
                    (diagnostic, index) => (
                        <li key={index}>
                            <strong>
                                {diagnostic.filePath}
                            </strong>

                            {diagnostic.location && (
                                <>
                                    {" — line "}
                                    {diagnostic.location.line}
                                    {", column "}
                                    {diagnostic.location.column}
                                </>
                            )}

                            {": "}
                            {diagnostic.message}
                        </li>
                    ),
                )}
            </ul>
        </section>
    );
}