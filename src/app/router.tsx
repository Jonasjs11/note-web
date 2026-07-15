import { createBrowserRouter } from "react-router-dom";

import Layout from "./Layout";
import Home from "../pages/Home";
import Note from "../pages/Note";
import Concept from "../pages/Concept";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: "concepts/:conceptId",
                element: <Concept />,
            },
            {
                path: "*",
                element: <Note />,
            },
        ],
    },
]);