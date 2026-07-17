import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    ReactNode,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    conceptSubjects,
    notes,
} from "../content";

import {
    useLanguage,
} from "./LanguageContext";

import {
    getSubjectPresentation,
} from "../navigation/subjectPresentation";

import {
    SubjectContext,
} from "./SubjectContext";

import type {
    SubjectContextValue,
    SubjectOption,
} from "./SubjectContext";

const SELECTED_SUBJECT_STORAGE_KEY =
    "note-web:selected-subject";

interface SubjectProviderProps {
    children: ReactNode;
}

export default function SubjectProvider({
    children,
}: SubjectProviderProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        language,
    } = useLanguage();

    const subjects = useMemo<SubjectOption[]>(
        () => {
            const subjectIds = Array.from(
                new Set(
                    notes.map(
                        (note) => note.subject,
                    ),
                ),
            ).sort((first, second) => {
                const firstPresentation =
                    getSubjectPresentation(
                        first,
                        language,
                    );

                const secondPresentation =
                    getSubjectPresentation(
                        second,
                        language,
                    );

                if (
                    firstPresentation.order !==
                    secondPresentation.order
                ) {
                    return (
                        firstPresentation.order -
                        secondPresentation.order
                    );
                }

                /*
                 * Stable fallback for unconfigured subjects.
                 * IDs do not change when the UI language changes.
                 */
                return first.localeCompare(second);
            });

            return subjectIds.map((id) => ({
                id,
                presentation:
                    getSubjectPresentation(
                        id,
                        language,
                    ),
            }));
        },
        [language],
    );

    const subjectIds = useMemo(() => {
        return new Set(
            subjects.map((subject) => subject.id),
        );
    }, [subjects]);

    const routeSubject = useMemo(() => {
        return findSubjectForPath(
            location.pathname,
            subjectIds,
        );
    }, [location.pathname, subjectIds]);

    const [manualSubject, setManualSubject] =
        useState<string>(() => {
            return (
                readStoredSubject(subjectIds) ??
                subjects[0]?.id ??
                ""
            );
        });

    const selectedSubject =
        routeSubject ?? manualSubject;

    useEffect(() => {
        if (!routeSubject) {
            return;
        }

        writeStoredSubject(routeSubject);

        const note = notes.find((candidate) => {
            return (
                candidate.url ===
                location.pathname
            );
        });

        if (note) {
            writeLastNotePath(
                routeSubject,
                note.url,
            );
        }
    }, [location.pathname, routeSubject]);

    const selectSubject = useCallback(
        (subject: string) => {
            if (!subjectIds.has(subject)) {
                return;
            }

            setManualSubject(subject);
            writeStoredSubject(subject);

            const destination =
                readLastNotePath(subject) ??
                notes.find((note) => {
                    return note.subject === subject;
                })?.url;

            if (destination) {
                navigate(destination);
            }
        },
        [navigate, subjectIds],
    );

    const selectedPresentation =
        getSubjectPresentation(
            selectedSubject,
            language,
        );

    const value = useMemo<SubjectContextValue>(
        () => ({
            subjects,
            selectedSubject,
            selectedPresentation,
            selectSubject,
        }),
        [
            selectedPresentation,
            selectedSubject,
            selectSubject,
            subjects,
        ],
    );

    return (
        <SubjectContext.Provider value={value}>
            {children}
        </SubjectContext.Provider>
    );
}

function findSubjectForPath(
    pathname: string,
    subjects: Set<string>,
): string | undefined {
    const segments = pathname
        .split("/")
        .filter(Boolean);

    const firstSegment = segments[0];

    if (
        firstSegment &&
        subjects.has(firstSegment)
    ) {
        return firstSegment;
    }

    if (
        firstSegment === "concepts" &&
        segments[1]
    ) {
        return conceptSubjects.get(
            segments[1].toLowerCase(),
        );
    }

    return undefined;
}

function readStoredSubject(
    subjects: Set<string>,
): string | undefined {
    try {
        const stored = localStorage.getItem(
            SELECTED_SUBJECT_STORAGE_KEY,
        );

        return stored && subjects.has(stored)
            ? stored
            : undefined;
    } catch {
        return undefined;
    }
}

function writeStoredSubject(
    subject: string,
): void {
    try {
        localStorage.setItem(
            SELECTED_SUBJECT_STORAGE_KEY,
            subject,
        );
    } catch {
        // The selection still works for this session.
    }
}

function readLastNotePath(
    subject: string,
): string | undefined {
    try {
        const stored = localStorage.getItem(
            createLastNoteStorageKey(subject),
        );

        if (
            stored &&
            notes.some((note) => {
                return (
                    note.subject === subject &&
                    note.url === stored
                );
            })
        ) {
            return stored;
        }
    } catch {
        // Fall through to the first note in the subject.
    }

    return undefined;
}

function writeLastNotePath(
    subject: string,
    path: string,
): void {
    try {
        localStorage.setItem(
            createLastNoteStorageKey(subject),
            path,
        );
    } catch {
        // Remembering the last path is optional.
    }
}

function createLastNoteStorageKey(
    subject: string,
): string {
    return `note-web:last-note:${subject}`;
}
