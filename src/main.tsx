import React from "react";
import ReactDOM from "react-dom/client";

import {
    RouterProvider,
} from "react-router-dom";

import LanguageProvider
    from "./app/LanguageProvider";

import ThemeProvider
    from "./app/ThemeProvider";

import {
    initializeLanguage,
} from "./app/language";

import {
    initializeTheme,
} from "./app/theme";

import {
    router,
} from "./app/router";

import "./index.css";

initializeLanguage();
initializeTheme();

ReactDOM.createRoot(
    document.getElementById("root")!,
).render(
    <React.StrictMode>
        <LanguageProvider>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </LanguageProvider>
    </React.StrictMode>,
);
