export interface WebSourceReference {
    kind: "web";
    url: string;
    siteName?: string;
}

export type SourceReference =
    WebSourceReference;