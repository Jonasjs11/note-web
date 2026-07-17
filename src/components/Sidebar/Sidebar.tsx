import {
    useMemo,
    useState,
} from "react";

import type {
    CSSProperties,
} from "react";

import {
    NavLink,
} from "react-router-dom";

import {
    useSubject,
} from "../../app/SubjectContext";

import {
    buildSubjectNavigation,
} from "../../content/builders/navigation";

import {
    notes,
} from "../../content";

import type {
    NavigationItem,
} from "../../types/Navigation";

import "./Sidebar.css";

interface SidebarProps {
    onNavigate?: () => void;
}

interface NavigationNodeProps {
    item: NavigationItem;
    depth: number;
    onNavigate?: () => void;
}

function NavigationNode({
    item,
    depth,
    onNavigate,
}: NavigationNodeProps) {
    const isFolder = Boolean(
        item.children?.length,
    );

    const [isExpanded, setIsExpanded] =
        useState(item.expanded ?? true);

    const indentationStyle = {
        paddingLeft: `${14 + depth * 18}px`,
    };

    if (!isFolder && item.path) {
        return (
            <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                    `navigation-node navigation-page ${
                        isActive
                            ? "navigation-page-active"
                            : ""
                    }`
                }
                style={indentationStyle}
            >
                <span
                    className="navigation-arrow"
                    aria-hidden="true"
                />

                <span className="navigation-label">
                    {item.title}
                </span>
            </NavLink>
        );
    }

    return (
        <div className="navigation-branch">
            <button
                className="navigation-node navigation-folder"
                style={indentationStyle}
                onClick={() => {
                    setIsExpanded(
                        currentlyExpanded =>
                            !currentlyExpanded,
                    );
                }}
                type="button"
                aria-expanded={isExpanded}
            >
                <span
                    className={
                        isExpanded
                            ? "navigation-arrow navigation-arrow--expanded"
                            : "navigation-arrow"
                    }
                    aria-hidden="true"
                >
                    <ChevronIcon />
                </span>

                <span className="navigation-label">
                    {item.title}
                </span>
            </button>

            {isExpanded && (
                <div>
                    {item.children?.map((child) => (
                        <NavigationNode
                            key={
                                child.path ??
                                child.title
                            }
                            item={child}
                            depth={depth + 1}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar({
    onNavigate,
}: SidebarProps) {
    const {
        selectedSubject,
        selectedPresentation,
    } = useSubject();

    const navigation = useMemo(() => {
        return buildSubjectNavigation(
            notes,
            selectedSubject,
        );
    }, [
        selectedSubject,
    ]);

    return (
        <aside
            id="site-sidebar"
            className="sidebar"
            aria-label={
                `${selectedPresentation.title} navigation`
            }
            style={
                {
                    "--subject-color":
                        selectedPresentation.color,
                } as CSSProperties
            }
        >
            <div
                key={selectedSubject}
                className="sidebar__tree"
            >
                {navigation.length > 0 ? (
                    navigation.map((item) => (
                        <NavigationNode
                            key={
                                item.path ??
                                item.title
                            }
                            item={item}
                            depth={0}
                            onNavigate={onNavigate}
                        />
                    ))
                ) : (
                    <p className="sidebar__empty">
                        No notes in this subject yet.
                    </p>
                )}
            </div>
        </aside>
    );
}

function ChevronIcon() {
    return (
        <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
        >
            <path
                d="m6 3 5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
