import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import type { Section } from "../../content/references/Section";
import DocumentAnchorLink from "../DocumentAnchorLink";
import { useUiTranslation } from "../../i18n/useUiTranslation";
import "./SiteContents.css";

interface SiteContentsProps { sections: Section[]; }
export default function SiteContents({ sections }: SiteContentsProps) {
    const t = useUiTranslation();
    const location = useLocation();
    const activeAnchorId = readAnchorFromLocationHash(location.hash);
    const minimumLevel = useMemo(() => sections.length
        ? Math.min(...sections.map(section => section.level)) : 2, [sections]);
    if (!sections.length) return null;
    return (
        <nav className="site-contents" aria-label={t("navigation.siteContents")}>
            <div className="site-contents__title">{t("navigation.siteContents")}</div>
            <ol className="site-contents__list">
                {sections.map(section => {
                    const depth = section.level - minimumLevel;
                    const isActive = activeAnchorId === section.anchorId;
                    return (
                        <li key={section.anchorId} className="site-contents__item"
                            style={{ "--site-contents-depth": depth } as CSSProperties}>
                            <DocumentAnchorLink anchorId={section.anchorId}
                                className={isActive
                                    ? "site-contents__link site-contents__link--active"
                                    : "site-contents__link"}
                                aria-current={isActive ? "location" : undefined}>
                                {section.displayText}
                            </DocumentAnchorLink>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
function readAnchorFromLocationHash(hash: string): string | undefined {
    const normalizedHash = hash.replace(/^#+/, "");
    if (!normalizedHash) return undefined;
    try { return decodeURIComponent(normalizedHash); }
    catch { return normalizedHash; }
}
