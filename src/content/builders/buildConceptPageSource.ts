import type { Concept } from "../models/Concept";

export function buildConceptPageSource(
    concept: Concept,
): string {
    const sections: string[] = [
        `# ${concept.title}`,
    ];

    if (concept.aliases.length > 0) {
        sections.push(
            [
                "## Aliases",
                concept.aliases
                    .map((alias) => `- ${alias}`)
                    .join("\n"),
            ].join("\n\n"),
        );
    }

    sections.push(
        [
            "## Short definition",
            concept.shortDefinition.trim(),
        ].join("\n\n"),
    );

    if (concept.notation) {
        sections.push(
            [
                "## Notation",
                concept.notation.trim(),
            ].join("\n\n"),
        );
    }

    if (concept.illustration) {
        sections.push(
            [
                "## Illustration",
                `![Illustration of ${concept.title}](${concept.illustration})`,
            ].join("\n\n"),
        );
    }

    if (concept.formalDefinition) {
        sections.push(
            [
                "## Formal definition",
                concept.formalDefinition.trim(),
            ].join("\n\n"),
        );
    }

    if (concept.prerequisites.length > 0) {
        sections.push(
            [
                "## Prerequisites",
                concept.prerequisites
                    .map((id) => {
                        return `- [${formatTitle(id)}](/concepts/${id})`;
                    })
                    .join("\n"),
            ].join("\n\n"),
        );
    }

    return sections.join("\n\n");
}

function formatTitle(value: string): string {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}