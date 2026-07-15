import { useParams } from "react-router-dom";

export default function Note() {
    const { subject, section, noteId } = useParams();

    return (
        <>
            <h1>{formatTitle(noteId)}</h1>

            <p>
                Subject: {formatTitle(subject)}
            </p>

            <p>
                Section: {formatTitle(section)}
            </p>

            <p>
                This page will eventually render the corresponding MDX note.
            </p>
        </>
    );
}

function formatTitle(value: string | undefined) {
    if (!value) {
        return "";
    }

    return value
        .split("-")
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}