import type { Diagnostic, DiagnosticResult } from "../models/Diagnostic";
import { encodeCommandToken } from "../commands/CommandToken";
import { findClosestMatch } from "../diagnostics/findClosestMatch";
import { getSourceLocation } from "../parser/getSourceLocation";
import { parseBibtex } from "../citations/parseBibtex";
import type { BibliographyEntry } from "../citations/parseBibtex";
import { resolveCitationUrl, citationSiteName } from "../citations/citationUrl";
import rawBibliography from "../citations/bibliography.bib?raw";
import { transformMarkdownText } from "./transformMarkdownText";

const bibliography = parseBibtex(rawBibliography);

interface RenderedEntry extends BibliographyEntry {
    citationNumber: number;
    anchorId: string;
    firstCitationId: string;
}

/**
 * Inline website citation:  \cite{https://example.com/path} -> (Example)
 * Inline BibTeX citation:    \cite{example-manual} -> [1]
 * \bibliography places the cited entries; absent it, they go at the end.
 */
export function transformCitationCommands(
    source: string,
    filePath: string,
): DiagnosticResult<string> {
    const diagnostics: Diagnostic[] = [];
    const used = new Map<string, RenderedEntry>();
    let citationCount = 0;
    let explicitBibliography = false;

    const transformed = transformMarkdownText(source, (text, sourceOffset) => {
        // Keep a marker until the full document has been processed so citations
        // appearing below \bibliography are included too.
        return text.replace(/\\cite\{([^{}]*)\}|\\bibliography(?:\{\}|\b)/g,
            (fullMatch: string, rawKey: string | undefined, index: number) => {
                if (fullMatch.startsWith("\\bibliography")) {
                    if (explicitBibliography) return "";
                    explicitBibliography = true;
                    return "\uE002BIBLIOGRAPHY\uE003";
                }

                const key = (rawKey ?? "").trim();
                const entry = bibliography.get(key);
                if (entry) {
                    let cited = used.get(key);
                    const referenceId = `citation-ref-${++citationCount}`;
                    if (!cited) {
                        cited = {
                            ...entry,
                            citationNumber: used.size + 1,
                            anchorId: `bibliography-${used.size + 1}`,
                            firstCitationId: referenceId,
                        };
                        used.set(key, cited);
                    }
                    return encodeCommandToken("cite-bib", [
                        String(cited.citationNumber), cited.anchorId, referenceId,
                        cited.title ?? key,
                    ]);
                }

                const url = resolveCitationUrl(key);
                if (url) {
                    return encodeCommandToken("cite-url", [url, citationSiteName(url)]);
                }

                const suggestion = findClosestMatch(key, Array.from(bibliography.keys()));
                diagnostics.push({
                    severity: "error",
                    message: key
                        ? `Unknown bibliography key or invalid URL "${key}".` +
                            (suggestion ? ` Did you mean "${suggestion}"?` : "")
                        : "A citation must contain a bibliography key or URL.",
                    filePath,
                    location: getSourceLocation(source, sourceOffset + index),
                });
                return fullMatch;
            });
    });

    const bibliographyToken = used.size > 0
        ? encodeCommandToken("bibliography", [JSON.stringify(Array.from(used.values()))])
        : "";
    const value = explicitBibliography
        ? transformed.replace(/\uE002BIBLIOGRAPHY\uE003/g, bibliographyToken ? `\n\n${bibliographyToken}\n\n` : "")
        : (bibliographyToken ? `${transformed.trimEnd()}\n\n${bibliographyToken}\n` : transformed);

    return { value, diagnostics };
}
