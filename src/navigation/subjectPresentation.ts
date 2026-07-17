import type {
    ContentLanguage,
} from "../i18n/contentLanguage";

export type SubjectIconName =
    | "mathematics"
    | "physics"
    | "subject";

export interface SubjectPresentation {
    title: string;
    color: string;
    icon: SubjectIconName;
    order: number;
}

interface SubjectPresentationDefinition {
    titles: Record<ContentLanguage, string>;
    color: string;
    icon: SubjectIconName;
    order: number;
}

const subjectPresentationRegistry:
    Record<
        string,
        SubjectPresentationDefinition
    > = {
        mathematics: {
            titles: {
                en: "Mathematics",
                da: "Matematik",
            },
            color: "#5b8def",
            icon: "mathematics",
            order: 10,
        },

        physics: {
            titles: {
                en: "Physics",
                da: "Fysik",
            },
            color: "#a970d6",
            icon: "physics",
            order: 20,
        },

        navigation: {
            titles: {
                en: "Navigation",
                da: "Navigation",
            },
            color: "#70d684",
            icon: "subject",
            order: 20,
        },
    };

export function getSubjectPresentation(
    subject: string,
    language: ContentLanguage = "en",
): SubjectPresentation {
    const definition =
        subjectPresentationRegistry[subject];

    if (!definition) {
        return {
            title: formatSubjectTitle(subject),
            color: "#6f8fae",
            icon: "subject",
            order: Number.MAX_SAFE_INTEGER,
        };
    }

    return {
        title: definition.titles[language],
        color: definition.color,
        icon: definition.icon,
        order: definition.order,
    };
}

export function formatSubjectTitle(
    value: string,
): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}
