import type { ReferenceNumber } from "./ReferenceTarget";

export function formatReferenceNumber(
    number: ReferenceNumber,
): string {
    return (
        number.primary.toString() +
        (number.sub ?? "")
    );
}