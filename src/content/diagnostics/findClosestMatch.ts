export function findClosestMatch(
    input: string,
    candidates: string[],
): string | undefined {
    const normalizedInput =
        input.trim().toLowerCase();

    if (!normalizedInput) {
        return undefined;
    }

    let closestMatch:
        | {
              candidate: string;
              distance: number;
          }
        | undefined;

    for (const candidate of candidates) {
        const distance = levenshteinDistance(
            normalizedInput,
            candidate.toLowerCase(),
        );

        if (
            !closestMatch ||
            distance < closestMatch.distance
        ) {
            closestMatch = {
                candidate,
                distance,
            };
        }
    }

    if (!closestMatch) {
        return undefined;
    }

    const maximumDistance = Math.max(
        2,
        Math.floor(
            normalizedInput.length * 0.35,
        ),
    );

    return closestMatch.distance <=
        maximumDistance
        ? closestMatch.candidate
        : undefined;
}

function levenshteinDistance(
    first: string,
    second: string,
): number {
    const previousRow = Array.from(
        { length: second.length + 1 },
        (_, index) => index,
    );

    const currentRow = new Array<number>(
        second.length + 1,
    );

    for (
        let firstIndex = 1;
        firstIndex <= first.length;
        firstIndex++
    ) {
        currentRow[0] = firstIndex;

        for (
            let secondIndex = 1;
            secondIndex <= second.length;
            secondIndex++
        ) {
            const substitutionCost =
                first[firstIndex - 1] ===
                second[secondIndex - 1]
                    ? 0
                    : 1;

            currentRow[secondIndex] =
                Math.min(
                    currentRow[
                        secondIndex - 1
                    ] + 1,
                    previousRow[secondIndex] + 1,
                    previousRow[
                        secondIndex - 1
                    ] + substitutionCost,
                );
        }

        for (
            let index = 0;
            index < currentRow.length;
            index++
        ) {
            previousRow[index] =
                currentRow[index];
        }
    }

    return previousRow[second.length];
}