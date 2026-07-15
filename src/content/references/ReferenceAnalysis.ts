import type { Diagnostic } from "../models/Diagnostic";
import type { ReferenceTarget } from "./ReferenceTarget";

export interface ReferenceAnalysis {
    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}