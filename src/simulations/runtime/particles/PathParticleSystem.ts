import {
    ParticlePool,
} from "./ParticlePool";

import type {
    ParticlePath,
    ParticlePathSample,
} from "./ParticlePath";

export interface PathParticle {
    distance: number;
    speed: number;
    radius: number;
    age: number;
    lifetime: number;
    alpha: number;

    readonly sample:
        ParticlePathSample;
}

export interface PathParticleSystemOptions {
    capacity: number;
    path: ParticlePath;

    /** Defaults to true. */
    loop?: boolean;

    /** Optional continuous spawn rate in particles per second. */
    spawnRate?: number;

    initialize?(
        particle: PathParticle,
        index: number,
    ): void;
}

/**
 * Fixed-capacity particles that move by arc length along one shared path.
 * This is intended for electrons in wires, flow markers and similar motion.
 */
export class PathParticleSystem {
    readonly pool:
        ParticlePool<PathParticle>;

    private path: ParticlePath;
    private readonly loop: boolean;
    private readonly spawnRate: number;
    private readonly initialize?:
        PathParticleSystemOptions["initialize"];

    private spawnAccumulator = 0;

    constructor(
        options: PathParticleSystemOptions,
    ) {
        this.path = options.path;
        this.loop = options.loop ?? true;
        this.spawnRate = Math.max(
            0,
            options.spawnRate ?? 0,
        );
        this.initialize = options.initialize;

        this.pool = new ParticlePool(
            options.capacity,
            () => createPathParticle(),
        );
    }

    get activeCount(): number {
        return this.pool.activeCount;
    }

    setPath(path: ParticlePath) {
        this.path = path;

        this.pool.forEachActive(
            (particle) => {
                particle.distance =
                    this.normalizeDistance(
                        particle.distance,
                    );
                this.path.sampleInto(
                    particle.distance,
                    particle.sample,
                );
            },
        );
    }

    spawn(
        configure?: (
            particle: PathParticle,
            index: number,
        ) => void,
    ): PathParticle | undefined {
        const slot = this.pool.activate(
            (particle, index) => {
                resetPathParticle(particle);
                this.initialize?.(
                    particle,
                    index,
                );
                configure?.(
                    particle,
                    index,
                );
                particle.distance =
                    this.normalizeDistance(
                        particle.distance,
                    );
                this.path.sampleInto(
                    particle.distance,
                    particle.sample,
                );
            },
        );

        return slot?.value;
    }

    seedEvenly(
        count: number,
        configure?: (
            particle: PathParticle,
            index: number,
        ) => void,
    ) {
        const amount = Math.min(
            Math.max(
                0,
                Math.floor(count),
            ),
            this.pool.remainingCapacity,
        );

        for (
            let index = 0;
            index < amount;
            index++
        ) {
            this.spawn(
                (particle, poolIndex) => {
                    particle.distance =
                        amount > 0
                            ? (index / amount) *
                              this.path.length
                            : 0;
                    configure?.(
                        particle,
                        poolIndex,
                    );
                },
            );
        }
    }

    update(deltaTime: number) {
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        if (this.spawnRate > 0) {
            this.spawnAccumulator +=
                deltaTime * this.spawnRate;

            while (
                this.spawnAccumulator >= 1 &&
                this.pool.remainingCapacity > 0
            ) {
                this.spawn();
                this.spawnAccumulator--;
            }
        }

        this.pool.forEachActive(
            (particle, index, slot) => {
                particle.age += deltaTime;

                if (
                    Number.isFinite(
                        particle.lifetime,
                    ) &&
                    particle.age >=
                        particle.lifetime
                ) {
                    this.pool.deactivate(slot);
                    return;
                }

                particle.distance +=
                    particle.speed *
                    deltaTime;

                if (!this.loop) {
                    if (
                        particle.distance < 0 ||
                        particle.distance >
                            this.path.length
                    ) {
                        this.pool.deactivate(
                            index,
                        );
                        return;
                    }
                } else {
                    particle.distance =
                        this.normalizeDistance(
                            particle.distance,
                        );
                }

                this.path.sampleInto(
                    particle.distance,
                    particle.sample,
                );
            },
        );
    }

    forEachActive(
        callback: (
            particle: PathParticle,
            index: number,
        ) => void,
    ) {
        this.pool.forEachActive(
            callback,
        );
    }

    clear() {
        this.pool.clear();
        this.spawnAccumulator = 0;
    }

    private normalizeDistance(
        distance: number,
    ): number {
        if (!this.loop) {
            return Math.min(
                this.path.length,
                Math.max(0, distance),
            );
        }

        return (
            (distance % this.path.length) +
            this.path.length
        ) % this.path.length;
    }
}

function createPathParticle(): PathParticle {
    return {
        distance: 0,
        speed: 1,
        radius: 2,
        age: 0,
        lifetime: Number.POSITIVE_INFINITY,
        alpha: 1,
        sample: {
            x: 0,
            y: 0,
            tangentX: 1,
            tangentY: 0,
        },
    };
}

function resetPathParticle(
    particle: PathParticle,
) {
    particle.distance = 0;
    particle.speed = 1;
    particle.radius = 2;
    particle.age = 0;
    particle.lifetime =
        Number.POSITIVE_INFINITY;
    particle.alpha = 1;
    particle.sample.x = 0;
    particle.sample.y = 0;
    particle.sample.tangentX = 1;
    particle.sample.tangentY = 0;
}
