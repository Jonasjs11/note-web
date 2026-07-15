import type { CSSProperties } from "react";

import { navigation } from "../../app/navigation";
import type { NavigationItem } from "../../types/Navigation";

import "./Sidebar.css";

interface NavigationNodeProps {
    item: NavigationItem;
    depth: number;
}

function NavigationNode({ item, depth }: NavigationNodeProps) {
    const indentationStyle = {
        "--navigation-depth": depth,
    } as CSSProperties;
    const isFolder = item.children !== undefined;

    return (
        <div>
            <div
                className="navigation-node"
                style={indentationStyle}
            >
                {isFolder ? "📁" : "📄"}
                {item.title}
            </div>

            {item.children?.map((child) => (
                <NavigationNode
                    key={child.path ?? `${depth}-${child.title}`}
                    item={child}
                    depth={depth + 1}
                />
            ))}
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