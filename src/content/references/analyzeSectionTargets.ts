import type {
    Diagnostic,
} from "../models/Diagnostic";

import {
    getSourceLocation,
} from "../parser/getSourceLocation";

import {
    createReferenceAnchor,
} from "./createReferenceAnchor";

import type {
    ReferenceTarget,
} from "./ReferenceTarget";

import type {
    Section,
} from "./Section";

import type {
    SectionAnalysis,
} from "./SectionAnalysis";

import {
    createSectionDisplayText,
} from "../sections/createSectionDisplayText";

import {
    createSectionSlug,
} from "../sections/createSectionSlug";

import {
    findMarkdownHeadings,
} from "../sections/findMarkdownHeadings";

interface HeadingLabelAnalysis {
    title: string;
    explicitLabel?: string;
    explicitLabelOffset?: number;
    hasLabelError: boolean;
}

/**
 * Creates a reference target for every h2-h6 Markdown heading.
 * Headings are intentionally unnumbered; their visible name is the
 * reference text.
 */
export function analyzeSectionTargets(
    source: string,
    filePath: string,
    existingTargets: ReferenceTarget[] = [],
): SectionAnalysis {
    const sections: Section[] = [];
    const targets: ReferenceTarget[] = [];
    const diagnostics: Diagnostic[] = [];

    const usedLabels = new Set(
        existingTargets.map(
            (target) => target.label,
        ),
    );

    for (const heading of findMarkdownHeadings(source)) {
        const labelAnalysis = analyzeHeadingLabel(
            source,
            filePath,
            heading.content,
            heading.contentStartOffset,
            diagnostics,
        );

        const authoredTitle =
            labelAnalysis.title.trim();

        const displayText =
            createSectionDisplayText(
                authoredTitle,
            ) || "Untitled section";

        if (!authoredTitle) {
            diagnostics.push({
                severity: "warning",
                message:
                    "A section heading should have a title.",
                filePath,
                location: getSourceLocation(
                    source,
                    heading.startOffset,
                ),
            });
        }

        let label: string;
        let explicitLabel = false;

        if (
            labelAnalysis.explicitLabel &&
            !labelAnalysis.hasLabelError
        ) {
            const requestedLabel =
                labelAnalysis.explicitLabel;

            if (!requestedLabel.startsWith("sec:")) {
                diagnostics.push({
                    severity: "warning",
                    message:
                        `Section label "${requestedLabel}" should start with "sec:".`,
                    filePath,
                    location: getSourceLocation(
                        source,
                        labelAnalysis.explicitLabelOffset ??
                            heading.startOffset,
                    ),
                });
            }

            if (usedLabels.has(requestedLabel)) {
                diagnostics.push({
                    severity: "error",
                    message:
                        `Duplicate label "${requestedLabel}".`,
                    filePath,
                    location: getSourceLocation(
                        source,
                        labelAnalysis.explicitLabelOffset ??
                            heading.startOffset,
                    ),
                });

                label = createUniqueAutomaticLabel(
                    displayText,
                    usedLabels,
                );
            } else {
                label = requestedLabel;
                explicitLabel = true;
            }
        } else {
            label = createUniqueAutomaticLabel(
                displayText,
                usedLabels,
            );
        }

        usedLabels.add(label);

        const anchorId =
            createReferenceAnchor(label);

        const section: Section = {
            title:
                authoredTitle ||
                "Untitled section",
            displayText,
            level: heading.level,
            label,
            anchorId,
            explicitLabel,
            source: heading.source,
            startOffset: heading.startOffset,
            endOffset: heading.endOffset,
        };

        const target: ReferenceTarget = {
            label,
            type: "section",
            displayText,
            anchorId,
        };

        sections.push(section);
        targets.push(target);
    }

    return {
        sections,
        targets,
        diagnostics,
    };
}

function analyzeHeadingLabel(
    completeSource: string,
    filePath: string,
    content: string,
    headingStartOffset: number,
    diagnostics: Diagnostic[],
): HeadingLabelAnalysis {
    const labelPattern =
        /\\label\{([^{}]*)\}/g;

    const matches = [
        ...content.matchAll(labelPattern),
    ];

    if (matches.length === 0) {
        return {
            title: content,
            hasLabelError: false,
        };
    }

    if (matches.length > 1) {
        for (const extraLabel of matches.slice(1)) {
            diagnostics.push({
                severity: "error",
                message:
                    "A section heading may only have one label.",
                filePath,
                location: getSourceLocation(
                    completeSource,
                    headingStartOffset +
                        (extraLabel.index ?? 0),
                ),
            });
        }
    }

    const firstLabel = matches[0];
    const fullLabelSource = firstLabel[0];
    const label = firstLabel[1].trim();
    const labelOffset =
        headingStartOffset +
        (firstLabel.index ?? 0);

    const sourceAfterLabel = content
        .slice(
            (firstLabel.index ?? 0) +
                fullLabelSource.length,
        )
        .trim();

    let hasLabelError =
        matches.length > 1;

    if (sourceAfterLabel) {
        diagnostics.push({
            severity: "error",
            message:
                "A section label must be the final item in its heading.",
            filePath,
            location: getSourceLocation(
                completeSource,
                labelOffset,
            ),
        });

        hasLabelError = true;
    }

    if (!label) {
        diagnostics.push({
            severity: "error",
            message:
                "A section label cannot be empty.",
            filePath,
            location: getSourceLocation(
                completeSource,
                labelOffset,
            ),
        });

        hasLabelError = true;
    }

    return {
        title: content
            .replace(labelPattern, "")
            .trim(),
        explicitLabel:
            label || undefined,
        explicitLabelOffset:
            labelOffset,
        hasLabelError,
    };
}

function createUniqueAutomaticLabel(
    displayText: string,
    usedLabels: Set<string>,
): string {
    const baseLabel =
        `sec:${createSectionSlug(displayText)}`;

    if (!usedLabels.has(baseLabel)) {
        return baseLabel;
    }

    let suffix = 2;

    while (
        usedLabels.has(
            `${baseLabel}-${suffix}`,
        )
    ) {
        suffix++;
    }

    return `${baseLabel}-${suffix}`;
}
