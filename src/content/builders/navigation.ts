import type { NavigationItem } from "../../types/Navigation";
import type { Note } from "../models/Note";

export function buildNavigation(
    notes: Note[],
): NavigationItem[] {
    const navigation: NavigationItem[] = [];

    for (const note of notes) {
        const pathSegments = [
            note.subject,
            ...note.folders,
        ];

        let currentLevel = navigation;

        for (const segment of pathSegments) {
            const folder = getOrCreateFolder(
                currentLevel,
                formatTitle(segment),
            );

            currentLevel = folder.children!;
        }

        currentLevel.push({
            title: note.title,
            path: note.url,
        });
    }

    sortNavigation(navigation);

    return navigation;
}

function getOrCreateFolder(
    items: NavigationItem[],
    title: string,
): NavigationItem {
    const existingFolder = items.find((item) => {
        return (
            item.title === title &&
            item.children !== undefined
        );
    });

    if (existingFolder) {
        return existingFolder;
    }

    const folder: NavigationItem = {
        title,
        children: [],
    };

    items.push(folder);

    return folder;
}

function sortNavigation(
    items: NavigationItem[],
): void {
    items.sort((first, second) => {
        const firstIsFolder =
            first.children !== undefined;

        const secondIsFolder =
            second.children !== undefined;

        if (firstIsFolder !== secondIsFolder) {
            return firstIsFolder ? -1 : 1;
        }

        return first.title.localeCompare(
            second.title,
        );
    });

    for (const item of items) {
        if (item.children) {
            sortNavigation(item.children);
        }
    }
}

function formatTitle(value: string): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}