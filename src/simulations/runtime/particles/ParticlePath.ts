export interface ParticlePoint {
    x: number;
    y: number;
}

export interface ParticlePathSample {
    x: number;
    y: number;
    tangentX: number;
    tangentY: number;
}

export interface ParticlePath {
    readonly length: number;

    sampleInto(
        distance: number,
        target: ParticlePathSample,
    ): ParticlePathSample;
}

export interface PolylineParticlePathOptions {
    closed?: boolean;
}

export function createPolylineParticlePath(
    points: readonly ParticlePoint[],
    options:
        PolylineParticlePathOptions = {},
): ParticlePath {
    if (points.length < 2) {
        throw new Error(
            "A particle path requires at least two points.",
        );
    }

    return new PolylineParticlePath(
        points,
        options.closed ?? false,
    );
}

class PolylineParticlePath
    implements ParticlePath {
    readonly length: number;

    private readonly points:
        ParticlePoint[];

    private readonly segmentLengths:
        number[];

    private readonly cumulativeLengths:
        number[];

    private readonly closed: boolean;

    constructor(
        points: readonly ParticlePoint[],
        closed: boolean,
    ) {
        this.closed = closed;
        this.points = points.map(
            (point) => ({ ...point }),
        );

        if (closed) {
            this.points.push({
                ...points[0],
            });
        }

        this.segmentLengths = [];
        this.cumulativeLengths = [0];

        let length = 0;

        for (
            let index = 0;
            index < this.points.length - 1;
            index++
        ) {
            const from = this.points[index];
            const to = this.points[index + 1];
            const segmentLength =
                Math.hypot(
                    to.x - from.x,
                    to.y - from.y,
                );

            this.segmentLengths.push(
                segmentLength,
            );
            length += segmentLength;
            this.cumulativeLengths.push(
                length,
            );
        }

        if (length <= 0) {
            throw new Error(
                "A particle path must have non-zero length.",
            );
        }

        this.length = length;
    }

    sampleInto(
        distance: number,
        target: ParticlePathSample,
    ): ParticlePathSample {
        const normalizedDistance =
            this.closed
                ? positiveModulo(
                      distance,
                      this.length,
                  )
                : clamp(
                      distance,
                      0,
                      this.length,
                  );

        const segmentIndex =
            this.findSegment(
                normalizedDistance,
            );

        const segmentStart =
            this.cumulativeLengths[
                segmentIndex
            ];
        const segmentLength =
            this.segmentLengths[
                segmentIndex
            ];

        const from =
            this.points[segmentIndex];
        const to =
            this.points[segmentIndex + 1];

        const progress =
            segmentLength > 0
                ? (normalizedDistance -
                      segmentStart) /
                  segmentLength
                : 0;

        const differenceX =
            to.x - from.x;
        const differenceY =
            to.y - from.y;

        target.x =
            from.x +
            differenceX * progress;
        target.y =
            from.y +
            differenceY * progress;

        if (segmentLength > 0) {
            target.tangentX =
                differenceX /
                segmentLength;
            target.tangentY =
                differenceY /
                segmentLength;
        } else {
            target.tangentX = 1;
            target.tangentY = 0;
        }

        return target;
    }

    private findSegment(
        distance: number,
    ): number {
        let low = 0;
        let high =
            this.segmentLengths.length - 1;

        while (low < high) {
            const middle = Math.floor(
                (low + high) / 2,
            );

            if (
                distance <=
                this.cumulativeLengths[
                    middle + 1
                ]
            ) {
                high = middle;
            } else {
                low = middle + 1;
            }
        }

        return low;
    }
}

function positiveModulo(
    value: number,
    modulus: number,
): number {
    return (
        (value % modulus) +
        modulus
    ) % modulus;
}

function clamp(
    value: number,
    minimum: number,
    maximum: number,
): number {
    return Math.min(
        maximum,
        Math.max(minimum, value),
    );
}
