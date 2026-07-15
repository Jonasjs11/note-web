import { useLocation } from "react-router-dom";

import { notes } from "../content/loader/loadNotes";

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

    return (
        <>
            <h1>{note.title}</h1>

            <p>Subject: {formatTitle(note.subject)}</p>

            {note.folders.length > 0 && (
                <p>
                    Folders:{" "}
                    {note.folders
                        .map(formatTitle)
                        .join(" → ")}
                </p>
            )}

            <p>
                This page will eventually render:
            </p>

            <pre>{note.filePath}</pre>
        </>
    );
}

function formatTitle(value: string): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}