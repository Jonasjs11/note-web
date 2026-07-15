import { useState } from "react";

import { navigation } from "../../app/navigation";
import type { NavigationItem } from "../../types/Navigation";

import "./Sidebar.css";

function NavigationNode({
    item,
    depth,
}: {
    item: NavigationItem;
    depth: number;
}) {
    const isFolder = Boolean(item.children?.length);

    const [isExpanded, setIsExpanded] = useState(true); // true means start expanded

    function handleClick() {
        if (isFolder) {
            setIsExpanded((currentlyExpanded) => !currentlyExpanded); //Reverse the expanded state on click
        }
    }

    return (
        <div>
            <button
                className="navigation-node"
                style={{
                    paddingLeft: `${16 + depth * 20}px`,
                }}
                onClick={handleClick}
                type="button"
            >
                <span className="navigation-arrow">
                    {isFolder ? (isExpanded ? "▼" : "▶") : ""}
                </span>

                <span>{item.title}</span>
            </button>

            {isFolder && isExpanded && (
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