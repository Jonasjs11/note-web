import {
    useEffect,
    useState,
} from "react";

import {
    Outlet,
    useLocation,
} from "react-router-dom";

import type {
    Section,
} from "../content/references/Section";

import Header
    from "../components/Header/Header";

import Sidebar
    from "../components/Sidebar/Sidebar";

import SiteContents
    from "../components/SiteContents/SiteContents";

import SubjectProvider
    from "./SubjectProvider";

export interface LayoutOutletContext {
    setSiteContentsSections:
        (sections: Section[]) => void;
}

export default function Layout() {
    const [
        siteContentsSections,
        setSiteContentsSections,
    ] = useState<Section[]>([]);

    const [
        isSidebarOpen,
        setIsSidebarOpen,
    ] = useState(false);

    const location = useLocation();

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        const anchorId =
            decodeURIComponent(
                location.hash.replace(/^#+/, ""),
            );

        let cancelled = false;
        let attempt = 0;

        function scrollToAnchor(): void {
            if (cancelled) {
                return;
            }

            const target =
                document.getElementById(
                    anchorId,
                );

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                return;
            }

            /*
             * MathJax equation anchors can be created
             * shortly after the React page renders.
             */
            if (attempt < 20) {
                attempt++;

                window.setTimeout(
                    scrollToAnchor,
                    50,
                );
            }
        }

        window.setTimeout(
            scrollToAnchor,
            0,
        );

        return () => {
            cancelled = true;
        };
    }, [
        location.pathname,
        location.hash,
    ]);

    useEffect(() => {
        if (!isSidebarOpen) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent,
        ): void {
            if (event.key === "Escape") {
                setIsSidebarOpen(false);
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        isSidebarOpen,
    ]);

    return (
        <SubjectProvider>
            <div
                className={
                    isSidebarOpen
                        ? "layout layout--sidebar-open"
                        : "layout"
                }
            >
                <Header
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => {
                        setIsSidebarOpen(
                            currentlyOpen =>
                                !currentlyOpen,
                        );
                    }}
                />

                <Sidebar
                    onNavigate={() => {
                        setIsSidebarOpen(false);
                    }}
                />

                {isSidebarOpen && (
                    <button
                        type="button"
                        className="sidebar-backdrop"
                        aria-label="Close navigation"
                        onClick={() => {
                            setIsSidebarOpen(false);
                        }}
                    />
                )}

                <main className="note-content-holder">
                    <div className="note-content-layout">
                        <div
                            className="
                                note-content-side
                                note-content-side--left
                            "
                            aria-hidden="true"
                        />

                        <div className="note-content-page">
                            <div className="note-content-page__surface">
                                <Outlet
                                    context={{
                                        setSiteContentsSections,
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="
                                note-content-side
                                note-content-side--right
                            "
                        >
                            <SiteContents
                                sections={
                                    siteContentsSections
                                }
                            />
                        </div>
                    </div>
                </main>
            </div>
        </SubjectProvider>
    );
}
