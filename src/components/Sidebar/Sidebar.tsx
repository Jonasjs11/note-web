import { useState } from "react";
import { NavLink } from "react-router-dom";

import { navigation } from "../../content";
import type { NavigationItem } from "../../types/Navigation";

import "./Sidebar.css";

interface NavigationNodeProps {
    item: NavigationItem;
    depth: number;
}

function NavigationNode({
    item,
    depth,
}: NavigationNodeProps) {
    const isFolder = Boolean(item.children?.length);

    const [isExpanded, setIsExpanded] = useState(true); // true means start expanded

    const indentationStyle = {
        paddingLeft: `${16 + depth * 20}px`,
    };

    if (!isFolder && item.path) {
        return (
            <NavLink
                to={item.path}
                className={({ isActive }) =>
                    `navigation-node navigation-page ${
                        isActive ? "navigation-page-active" : ""
                    }`
                }
                style={indentationStyle}
            >
                <span className="navigation-arrow" />

                <span>{item.title}</span>
            </NavLink>
        );
    }

    return (
        <div>
            <button
                className="navigation-node navigation-folder"
                style={indentationStyle}
                onClick={() => {
                    setIsExpanded((currentlyExpanded) => {
                        return !currentlyExpanded;
                    });
                }}
                type="button"
                aria-expanded={isExpanded}
            >
                <span className="navigation-arrow">
                    {isExpanded ? "▼" : "▶"}
                </span>

                <span>{item.title}</span>
            </button>

            {isExpanded && (
                <div>
                    {item.children?.map((child) => (
                        <NavigationNode
                            key={child.path ?? child.title}
                            item={child}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    return (
        <aside className="sidebar">
            {navigation.map((item) => (
                <NavigationNode
                    key={item.path ?? item.title}
                    item={item}
                    depth={0}
                />
            ))}
        </aside>
    );
}