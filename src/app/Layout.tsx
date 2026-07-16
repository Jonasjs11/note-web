import { Outlet } from "react-router-dom";

import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";

export default function Layout() {
    return (
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
                            <Outlet />
                        </div>
                    </div>

                    <div
                        className="
                            note-content-side
                            note-content-side--right
                        "
                    >
                        <nav
                            className="site-contents"
                            aria-label="Site contents"
                        >
                            <div className="site-contents__title">
                                Site contents
                            </div>

                            <div className="site-contents__placeholder">
                                Page sections will appear here.
                            </div>
                        </nav>
                    </div>
                </div>
            </main>
        </div>
    );
}