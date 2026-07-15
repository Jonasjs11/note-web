export interface Note {
    id: string;
    title: string;

    subject: string;
    folders: string[];

    url: string;
    filePath: string;
    source: string;

    error?: string;
}