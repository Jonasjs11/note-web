import {
    useMemo,
} from "react";

import type {
    CSSProperties,
} from "react";

import {
    useLocation,
} from "react-router-dom";

import type {
    Section,
} from "../../content/references/Section";

import DocumentAnchorLink
    from "../DocumentAnchorLink";

import "./SiteContents.css";

interface SiteContentsProps {
    sections: Section[];
}

export default function SiteContents({
    sections,
}: SiteContentsProps) {
    const location = useLocation();

    /*
     * With createHashRouter, React Router separates
     * the route pathname from the document anchor.
     *
     * For:
     * #/physics/forces#sec-forces
     *
     * location.pathname is:
     * /physics/forces
     *
     * location.hash is:
     * #sec-forces
     */
    const activeAnchorId =
        readAnchorFromLocationHash(
            location.hash,
        );

    const minimumLevel = useMemo(() => {
        if (sections.length === 0) {
            return 2;
        }

        return Math.min(
            ...sections.map(
                (section) => section.level,
            ),
        );
    }, [
        sections,
    ]);

    if (sections.length === 0) {
        return null;
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
                            <DocumentAnchorLink
                                anchorId={
                                    section.anchorId
                                }
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
                            >
                                {
                                    section.displayText
                                }
                            </DocumentAnchorLink>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function readAnchorFromLocationHash(
    hash: string,
): string | undefined {
    const normalizedHash =
        hash.replace(/^#+/, "");

    if (!normalizedHash) {
        return undefined;
    }

    try {
        return decodeURIComponent(
            normalizedHash,
        );
    } catch {
        return normalizedHash;
    }
}