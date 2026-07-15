import type {
    ReferenceNumber,
} from "./ReferenceTarget";

/**
 * Owns the equation-numbering state for one note.
 *
 * Ordinary mode:
 *
 *     1, 2, 3, ...
 *
 * Subequation mode:
 *
 *     4a, 4b, 4c, ...
 */
export class EquationNumbering {
    private primaryNumber = 0;

    private subequationIndex:
        number | undefined;

    /**
     * Returns the next number according to the
     * currently active numbering mode.
     */
    public next(): ReferenceNumber {
        if (
            this.subequationIndex !== undefined
        ) {
            this.subequationIndex++;

            return {
                primary: this.primaryNumber,
                sub: toAlphabeticSuffix(
                    this.subequationIndex,
                ),
            };
        }

        this.primaryNumber++;

        return {
            primary: this.primaryNumber,
        };
    }

    /**
     * Reserves the next primary number and begins
     * producing alphabetic child numbers.
     *
     * Example:
     *
     *     current primary = 3
     *
     *     beginSubequations()
     *     next() -> 4a
     *     next() -> 4b
     */
    public beginSubequations(): void {
        if (
            this.subequationIndex !== undefined
        ) {
            throw new Error(
                "Nested subequation groups are not supported.",
            );
        }

        this.primaryNumber++;
        this.subequationIndex = 0;
    }

    public endSubequations(): void {
        if (
            this.subequationIndex === undefined
        ) {
            throw new Error(
                "Cannot end subequations because no subequation group is active.",
            );
        }

        this.subequationIndex = undefined;
    }

    public isInsideSubequations(): boolean {
        return (
            this.subequationIndex !== undefined
        );
    }
}

/**
 * Converts:
 *
 *     1  -> a
 *     2  -> b
 *     26 -> z
 *     27 -> aa
 */
function toAlphabeticSuffix(
    index: number,
): string {
    if (index < 1) {
        throw new Error(
            "An alphabetic suffix index must be at least 1.",
        );
    }

    let remaining = index;
    let result = "";

    while (remaining > 0) {
        remaining--;

        const characterCode =
            "a".charCodeAt(0) +
            (remaining % 26);

        result =
            String.fromCharCode(
                characterCode,
            ) + result;

        remaining =
            Math.floor(remaining / 26);
    }

    return result;
}