import type {
    SourceReference,
} from "./SourceReference";

export function getSourceHostname(
    source: SourceReference,
): string {
    try {
        return new URL(
            source.url,
        ).hostname.replace(
            /^www\./,
            "",
        );
    } catch {
        /*
         * Analysis should prevent invalid URLs from
         * reaching rendering, but rendering should
         * still never crash.
         */
        return source.url;
    }
}