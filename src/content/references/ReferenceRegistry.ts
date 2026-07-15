import type { ReferenceTarget } from "./ReferenceTarget";

export class ReferenceRegistry {
    private readonly targetsByLabel:
        ReadonlyMap<string, ReferenceTarget>;

    public constructor(
        targets: ReferenceTarget[],
    ) {
        this.targetsByLabel = new Map(
            targets.map((target) => [
                target.label,
                target,
            ]),
        );
    }

    public find(
        label: string,
    ): ReferenceTarget | undefined {
        return this.targetsByLabel.get(
            normalizeLabel(label),
        );
    }

    public has(label: string): boolean {
        return this.targetsByLabel.has(
            normalizeLabel(label),
        );
    }

    public labels(): string[] {
        return [
            ...this.targetsByLabel.keys(),
        ];
    }

    public targets(): ReferenceTarget[] {
        return [
            ...this.targetsByLabel.values(),
        ];
    }
}

function normalizeLabel(
    label: string,
): string {
    return label.trim();
}