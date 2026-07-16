import type {
    Diagnostic,
} from "../models/Diagnostic";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

import type {
    Section,
} from "./Section";

export interface SectionAnalysis {
    sections: Section[];
    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}
