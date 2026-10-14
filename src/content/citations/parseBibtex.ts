/**
 * A small, dependency-free parser for common BibTeX entries.
 * Supports braced, quoted and bare field values, including nested braces.
 * This intentionally does not implement BibTeX macros, concatenation or crossref.
 */
export interface BibliographyEntry {
    key: string;
    type: string;
    author?: string;
    title?: string;
    year?: string;
    organization?: string;
    publisher?: string;
    journal?: string;
    booktitle?: string;
    volume?: string;
    number?: string;
    pages?: string;
    edition?: string;
    doi?: string;
    url?: string;
    note?: string;
}

export function parseBibtex(source: string): Map<string, BibliographyEntry> {
    const entries = new Map<string, BibliographyEntry>();
    let position = 0;

    while (position < source.length) {
        const start = source.indexOf("@", position);
        if (start === -1) break;
        position = start + 1;

        const typeMatch = /^[A-Za-z]+/.exec(source.slice(position));
        if (!typeMatch) continue;
        const type = typeMatch[0].toLowerCase();
        position += typeMatch[0].length;
        position = skipWhitespace(source, position);
        const open = source[position];
        if (open !== "{" && open !== "(") continue;
        const close = open === "{" ? "}" : ")";
        position++;
        const end = findClosing(source, position, open, close);
        if (end === -1) break;
        const body = source.slice(position, end);
        position = end + 1;
        if (type === "comment" || type === "preamble" || type === "string") continue;

        const firstComma = findTopLevelComma(body);
        if (firstComma === -1) continue;
        const key = body.slice(0, firstComma).trim();
        if (!key || entries.has(key)) continue;
        const fields = parseFields(body.slice(firstComma + 1));
        entries.set(key, {
            key,
            type,
            ...fields,
        });
    }
    return entries;
}

function skipWhitespace(text: string, start: number): number {
    let index = start;
    while (index < text.length && /\s/.test(text[index])) index++;
    return index;
}

function findClosing(
    text: string,
    start: number,
    open: string,
    close: string,
): number {
    let level = 1;
    let quoted = false;
    for (let index = start; index < text.length; index++) {
        const char = text[index];
        if (char === "\\") { index++; continue; }
        if (char === '"') quoted = !quoted;
        if (quoted) continue;
        if (char === open) level++;
        if (char === close && --level === 0) return index;
    }
    return -1;
}

function findTopLevelComma(text: string): number {
    let depth = 0;
    let quoted = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === "\\") { index++; continue; }
        if (char === '"' && depth === 0) quoted = !quoted;
        if (quoted) continue;
        if (char === "{") depth++;
        else if (char === "}") depth--;
        else if (char === "," && depth === 0) return index;
    }
    return -1;
}

function parseFields(source: string): Partial<BibliographyEntry> {
    const result: Partial<BibliographyEntry> = {};
    const allowed = new Set<keyof BibliographyEntry>([
        "author", "title", "year", "organization", "publisher", "journal",
        "booktitle", "volume", "number", "pages", "edition", "doi", "url", "note",
    ]);
    for (const part of splitTopLevel(source)) {
        const match = /^\s*([A-Za-z][\w-]*)\s*=\s*([\s\S]*?)\s*$/.exec(part);
        if (!match) continue;
        const field = match[1].toLowerCase() as keyof BibliographyEntry;
        if (!allowed.has(field)) continue;
        const cleaned = cleanValue(match[2]);
        result[field] = field === "author"
            ? cleaned.replace(/\s+and\s+/g, ", ")
            : cleaned;
    }
    return result;
}

function splitTopLevel(source: string): string[] {
    const parts: string[] = [];
    let start = 0;
    let depth = 0;
    let quoted = false;
    for (let index = 0; index < source.length; index++) {
        const char = source[index];
        if (char === "\\") { index++; continue; }
        if (char === '"' && depth === 0) quoted = !quoted;
        if (quoted) continue;
        if (char === "{") depth++;
        else if (char === "}") depth--;
        else if (char === "," && depth === 0) {
            parts.push(source.slice(start, index));
            start = index + 1;
        }
    }
    parts.push(source.slice(start));
    return parts;
}

function cleanValue(value: string): string {
    let result = value.trim();
    while (
        result.length >= 2 &&
        ((result.startsWith("{") && result.endsWith("}")) ||
         (result.startsWith('"') && result.endsWith('"')))
    ) {
        result = result.slice(1, -1).trim();
    }
    return result
        .replace(/\\&/g, "&")
        .replace(/\\_/g, "_")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ");
}
