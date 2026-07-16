import type {
    Diagnostic,
} from "../models/Diagnostic";

import type {
    NumberedTable,
} from "./NumberedTable";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

export interface TableAnalysis {
    numberedTables: NumberedTable[];
    targets: ReferenceTarget[];
    diagnostics: Diagnostic[];
}
