import type {
    Diagnostic,
} from "../models/Diagnostic";

import type {
    NumberedEquation,
} from "./NumberedEquation";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

export interface ReferenceAnalysis {
    numberedEquations: NumberedEquation[];
    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}