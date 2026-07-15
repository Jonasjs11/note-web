import type { NavigationItem } from "../types/Navigation";

export const navigation: NavigationItem[] = [
    {
        title: "Physics",
        children: [
            {
                title: "Mechanics",
                children: [
                    {
                        title: "Vectors",
                        path: "/physics/mechanics/vectors",
                    },
                    {
                        title: "Forces",
                        path: "/physics/mechanics/forces",
                    },
                ],
            },
        ],
    },

    {
        title: "Mathematics",
        children: [
            {
                title: "Calculus",
                children: [
                    {
                        title: "Derivatives",
                        path: "/math/calculus/derivatives",
                    },
                ],
            },
        ],
    },
];