import type { Diagnostic } from "./Diagnostic";

export interface Note {
    id: string;
    title: string;

    subject: string;
    folders: string[];

    url: string;
    filePath: string;

    source: string;
    transformedSource: string;

    diagnostics: Diagnostic[];
}