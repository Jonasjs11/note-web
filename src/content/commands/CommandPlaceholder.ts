const PLACEHOLDER_START = "\uE000";
const PLACEHOLDER_END = "\uE001";

export interface ConceptCommandData {
    id: string;
    alias?: string;
}

/*export function createConceptPlaceholder(
    data: ConceptCommandData,
): string {
    const encodedData = encodeURIComponent(
        JSON.stringify(data),
    );

    return (
        `${PLACEHOLDER_START}` +
        `concept:${encodedData}` +
        `${PLACEHOLDER_END}`
    );
}*/
export function createConceptPlaceholder(
    data: ConceptCommandData,
): string {
    const encodedData = encodeURIComponent(
        JSON.stringify(data),
    );

    return `@@concept:${encodedData}@@`;
}