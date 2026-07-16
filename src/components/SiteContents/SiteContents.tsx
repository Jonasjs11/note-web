import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    CSSProperties,
    MouseEvent,
} from "react";

import type {
    Section,
} from "../../content/references/Section";

import "./SiteContents.css";

interface SiteContentsProps {
    sections: Section[];
}

export default function SiteContents({
    sections,
}: SiteContentsProps) {
    const [activeAnchorId, setActiveAnchorId] =
        useState<string | undefined>(() => {
            return readAnchorFromHash();
        });

    const minimumLevel = useMemo(() => {
        if (sections.length === 0) {
            return 2;
        }

        return Math.min(
            ...sections.map(
                (section) => section.level,
            ),
        );
    }, [sections]);

    useEffect(() => {
        function handleHashChange() {
            setActiveAnchorId(
                readAnchorFromHash(),
            );
        }

        window.addEventListener(
            "hashchange",
            handleHashChange,
        );

        handleHashChange();

        return () => {
            window.removeEventListener(
                "hashchange",
                handleHashChange,
            );
        };
    }, []);

    if (sections.length === 0) {
        return null;
    }

    function handleSectionClick(
        event: MouseEvent<HTMLAnchorElement>,
        section: Section,
    ) {
        event.preventDefault();

        const target = document.getElementById(
            section.anchorId,
        );

        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        const nextHash = `#${section.anchorId}`;

        if (window.location.hash === nextHash) {
            window.history.replaceState(
                null,
                "",
                nextHash,
            );
        } else {
            window.history.pushState(
                null,
                "",
                nextHash,
            );
        }

        setActiveAnchorId(
            section.anchorId,
        );
    }

    return (
        <nav
            className="site-contents"
            aria-label="Site contents"
        >
            <div className="site-contents__title">
                Site contents
            </div>

            <ol className="site-contents__list">
                {sections.map((section) => {
                    const depth =
                        section.level -
                        minimumLevel;

                    const isActive =
                        activeAnchorId ===
                        section.anchorId;

                    return (
                        <li
                            key={section.anchorId}
                            className="site-contents__item"
                            style={{
                                "--site-contents-depth":
                                    depth,
                            } as CSSProperties}
                        >
                            <a
                                href={`#${section.anchorId}`}
                                className={
                                    isActive
                                        ? "site-contents__link site-contents__link--active"
                                        : "site-contents__link"
                                }
                                aria-current={
                                    isActive
                                        ? "location"
                                        : undefined
                                }
                                onClick={(event) => {
                                    handleSectionClick(
                                        event,
                                        section,
                                    );
                                }}
                            >
                                {section.displayText}
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function readAnchorFromHash():
    | string
    | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const hash = window.location.hash;

    if (!hash) {
        return undefined;
    }

    try {
        return decodeURIComponent(
            hash.slice(1),
        );
    } catch {
        return hash.slice(1);
    }
}
