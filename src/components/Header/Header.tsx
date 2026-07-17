import type {
    CSSProperties,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    useSubject,
} from "../../app/SubjectContext";

import LanguageToggle from "./LanguageToggle";
import NoteSearch from "./NoteSearch";
import ProjectIcon from "./ProjectIcon";
import SubjectIcon from "./SubjectIcon";
import ThemeToggle from "./ThemeToggle";

import "./Header.css";

interface HeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function Header({
    isSidebarOpen,
    onToggleSidebar,
}: HeaderProps) {
    const {
        subjects,
        selectedSubject,
        selectSubject,
    } = useSubject();

    return (
        <header className="app-header">
            <button
                type="button"
                className="sidebar-toggle"
                aria-label={
                    isSidebarOpen
                        ? "Close navigation"
                        : "Open navigation"
                }
                aria-controls="site-sidebar"
                aria-expanded={isSidebarOpen}
                onClick={onToggleSidebar}
            >
                <span aria-hidden="true">
                    {isSidebarOpen ? "×" : "☰"}
                </span>
            </button>

            <Link
                to="/"
                className="app-header__brand"
                aria-label="Note Web home"
            >
                <span className="app-header__brand-icon">
                    <ProjectIcon />
                </span>

                <span className="app-header__brand-name">
                    Note Web
                </span>
            </Link>

            <nav
                className="subject-tabs"
                aria-label="Subjects"
            >
                {subjects.map((subject) => {
                    const isSelected =
                        subject.id ===
                        selectedSubject;

                    return (
                        <button
                            key={subject.id}
                            type="button"
                            className={
                                isSelected
                                    ? "subject-tab subject-tab--selected"
                                    : "subject-tab"
                            }
                            style={
                                {
                                    "--subject-color":
                                        subject
                                            .presentation
                                            .color,
                                } as CSSProperties
                            }
                            aria-pressed={isSelected}
                            onClick={() => {
                                selectSubject(
                                    subject.id,
                                );
                            }}
                        >
                            <SubjectIcon
                                icon={
                                    subject
                                        .presentation
                                        .icon
                                }
                            />

                            <span>
                                {
                                    subject
                                        .presentation
                                        .title
                                }
                            </span>
                        </button>
                    );
                })}
            </nav>

            <div className="app-header__actions">
                <NoteSearch />
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </header>
    );
}
