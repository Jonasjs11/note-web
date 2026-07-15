export interface NavigationItem {
    title: string;

    path?: string;

    children?: NavigationItem[];

    expanded?: boolean;
}