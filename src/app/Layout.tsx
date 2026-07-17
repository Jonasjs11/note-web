import {
    useState,
} from "react";

import {
    Outlet,
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

    return (
        <SubjectProvider>
            <div className="layout">
                <Header />

                <Sidebar />

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
