import type { Diagnostic } from "./Diagnostic";

import type { ReferenceTarget } from "../references/ReferenceTarget";

export interface Note {
    id: string;
    title: string;

    subject: string;
    folders: string[];

    url: string;
    filePath: string;

    source: string;
    transformedSource: string;

    references: ReferenceTarget[];
    diagnostics: Diagnostic[];
}