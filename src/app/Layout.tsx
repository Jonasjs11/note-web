import { Outlet } from "react-router-dom";

import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";

export default function Layout() {
    return (
        <div className="layout">
            <Header />

            <Sidebar />

            <main>
                <Outlet />
            </main>
        </div>
    );
}