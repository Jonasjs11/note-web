/** Parses an HTTPS/HTTP URL or a bare hostname such as wikipedia.com. */
export function resolveCitationUrl(input: string): string | undefined {
    const trimmed = input.trim();
    if (!trimmed || /[\s<>]/.test(trimmed)) return undefined;

    const hasScheme = /^https?:\/\//i.test(trimmed);
    if (!hasScheme && /^[A-Za-z][\w+.-]*:/.test(trimmed)) return undefined;
    if (!hasScheme && !/^(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?::\d+)?(?:[/?#][^\s]*)?$/.test(trimmed)) {
        return undefined;
    }

    try {
        const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
        if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return undefined;
        return url.href;
    } catch {
        return undefined;
    }
}

/** Converts hostnames into simple, human-friendly site names. */
export function citationSiteName(link: string): string {
    const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
    const labels = host.split(".");
    const isCountrySecondLevel = labels.length >= 3 &&
        labels[labels.length - 1].length === 2 &&
        new Set(["co", "com", "org", "gov", "ac", "net", "edu"]).has(labels[labels.length - 2]);
    const name = labels[Math.max(0, labels.length - (isCountrySecondLevel ? 3 : 2))];
    const acronyms: Record<string, string> = {
        bbc: "BBC", nasa: "NASA", icao: "ICAO", faa: "FAA", easa: "EASA",
        pdf: "PDF", mit: "MIT", eu: "EU", dk: "DK",
    };
    return acronyms[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}
