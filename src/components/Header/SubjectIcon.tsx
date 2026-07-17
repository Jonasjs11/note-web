import type {
    SubjectIconName,
} from "../../navigation/subjectPresentation";

interface SubjectIconProps {
    icon: SubjectIconName;
}

export default function SubjectIcon({
    icon,
}: SubjectIconProps) {
    if (icon === "mathematics") {
        return (
            <svg
                className="subject-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M18.5 5H6.25L13 12l-6.75 7h12.25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (icon === "physics") {
        return (
            <svg
                className="subject-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="1.65"
                    fill="currentColor"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="8.5"
                    ry="3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.55"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="8.5"
                    ry="3.5"
                    transform="rotate(60 12 12)"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.55"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="8.5"
                    ry="3.5"
                    transform="rotate(120 12 12)"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.55"
                />
            </svg>
        );
    }

    return (
        <svg
            className="subject-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />

            <path
                d="M5 16h10.5A3.5 3.5 0 0 1 19 19.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    );
}
