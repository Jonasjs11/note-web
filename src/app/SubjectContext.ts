import {
    createContext,
    useContext,
} from "react";

import type {
    SubjectPresentation,
} from "../navigation/subjectPresentation";

export interface SubjectOption {
    id: string;
    presentation: SubjectPresentation;
}

export interface SubjectContextValue {
    subjects: SubjectOption[];
    selectedSubject: string;
    selectedPresentation: SubjectPresentation;
    selectSubject: (subject: string) => void;
}

export const SubjectContext =
    createContext<SubjectContextValue | undefined>(
        undefined,
    );

export function useSubject():
    SubjectContextValue {
    const context = useContext(SubjectContext);

    if (!context) {
        throw new Error(
            "useSubject must be used inside SubjectProvider.",
        );
    }

    return context;
}
