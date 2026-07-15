export type DiagnosticSeverity = "error" | "warning";

export interface SourceLocation {
    line: number;
    column: number;
}

export interface Diagnostic {
    severity: DiagnosticSeverity;
    message: string;
    filePath: string;
    location?: SourceLocation;
}

export interface DiagnosticResult<T> {
    value: T;
    diagnostics: Diagnostic[];
}