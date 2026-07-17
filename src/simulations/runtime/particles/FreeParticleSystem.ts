import {
    ParticlePool,
} from "./ParticlePool";

export interface ParticleBounds {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export type ParticleBoundaryMode =
    | "none"
    | "wrap"
    | "bounce"
    | "recycle";

export interface FreeParticle {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    radius: number;
    mass: number;
    age: number;
    lifetime: number;
    alpha: number;
}

export interface ParticleCollisionOptions {
    /** Defaults to 1 for perfectly elastic collisions. */
    restitution?: number;

    /** Defaults to 1. More iterations improve dense stacks but cost more. */
    iterations?: number;
}

export interface FreeParticleSystemOptions {
    capacity: number;
    bounds: ParticleBounds;

    /** Defaults to none. */
    boundary?: ParticleBoundaryMode;

    /** Number created immediately and maintained after recycling. */
    targetCount?: number;

    collisions?:
        | boolean
        | ParticleCollisionOptions;

    initialize(
        particle: FreeParticle,
        index: number,
    ): void;

    /** Mutate velocity here to apply gravity, wind or other acceleration. */
    beforeIntegrate?(
        particle: FreeParticle,
        deltaTime: number,
        index: number,
    ): void;
}

/**
 * Fixed-capacity freely moving particles. It supports no boundary handling,
 * wrapping, bouncing, or recycling, plus optional elastic circle collisions.
 */
export class FreeParticleSystem {
    readonly pool:
        ParticlePool<FreeParticle>;

    private bounds:
        ParticleBounds;

    private readonly boundary:
        ParticleBoundaryMode;

    private readonly targetCount: number;
    private readonly initialize:
        FreeParticleSystemOptions["initialize"];
    private readonly beforeIntegrate?:
        FreeParticleSystemOptions["beforeIntegrate"];

    private readonly collisionOptions:
        Required<ParticleCollisionOptions> | undefined;

    constructor(
        options: FreeParticleSystemOptions,
    ) {
        this.bounds = {
            ...options.bounds,
        };
        this.boundary =
            options.boundary ?? "none";
        this.targetCount = Math.min(
            Math.max(
                0,
                Math.floor(
                    options.targetCount ?? 0,
                ),
            ),
            Math.max(
                0,
                Math.floor(options.capacity),
            ),
        );
        this.initialize = options.initialize;
        this.beforeIntegrate =
            options.beforeIntegrate;

        this.collisionOptions =
            options.collisions
                ? {
                      restitution:
                          typeof options.collisions ===
                          "object"
                              ? clamp(
                                    options.collisions
                                        .restitution ?? 1,
                                    0,
                                    1,
                                )
                              : 1,
                      iterations:
                          typeof options.collisions ===
                          "object"
                              ? Math.max(
                                    1,
                                    Math.floor(
                                        options.collisions
                                            .iterations ?? 1,
                                    ),
                                )
                              : 1,
                  }
                : undefined;

        this.pool = new ParticlePool(
            options.capacity,
            () => createFreeParticle(),
        );

        this.maintainTargetCount();
    }

    get activeCount(): number {
        return this.pool.activeCount;
    }

    setBounds(bounds: ParticleBounds) {
        this.bounds = {
            ...bounds,
        };
    }

    spawn(
        configure?: (
            particle: FreeParticle,
            index: number,
        ) => void,
    ): FreeParticle | undefined {
        const slot = this.pool.activate(
            (particle, index) => {
                resetFreeParticle(particle);
                this.initialize(
                    particle,
                    index,
                );
                configure?.(
                    particle,
                    index,
                );
                normalizeParticle(particle);
            },
        );

        return slot?.value;
    }

    update(deltaTime: number) {
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
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
                    this.recycleOrDeactivate(
                        particle,
                        index,
                        slot.index,
                    );
                    return;
                }

                this.beforeIntegrate?.(
                    particle,
                    deltaTime,
                    index,
                );

                particle.x +=
                    particle.velocityX *
                    deltaTime;
                particle.y +=
                    particle.velocityY *
                    deltaTime;

                this.applyBoundary(
                    particle,
                    index,
                    slot.index,
                );
            },
        );

        if (this.collisionOptions) {
            for (
                let iteration = 0;
                iteration <
                    this.collisionOptions
                        .iterations;
                iteration++
            ) {
                this.pool.forEachActivePair(
                    (first, second) => {
                        resolveCircleCollision(
                            first,
                            second,
                            this.collisionOptions
                                ?.restitution ?? 1,
                        );
                    },
                );
            }
        }

        this.maintainTargetCount();
    }

    forEachActive(
        callback: (
            particle: FreeParticle,
            index: number,
        ) => void,
    ) {
        this.pool.forEachActive(
            callback,
        );
    }

    clear() {
        this.pool.clear();
    }

    reset() {
        this.pool.clear();
        this.maintainTargetCount();
    }

    private applyBoundary(
        particle: FreeParticle,
        index: number,
        slotIndex: number,
    ) {
        const bounds = this.bounds;
        const radius = particle.radius;

        switch (this.boundary) {
            case "none":
                return;

            case "wrap": {
                const width =
                    bounds.xMax -
                    bounds.xMin;
                const height =
                    bounds.yMax -
                    bounds.yMin;

                if (particle.x < bounds.xMin) {
                    particle.x += width;
                } else if (
                    particle.x > bounds.xMax
                ) {
                    particle.x -= width;
                }

                if (particle.y < bounds.yMin) {
                    particle.y += height;
                } else if (
                    particle.y > bounds.yMax
                ) {
                    particle.y -= height;
                }
                return;
            }

            case "bounce": {
                if (
                    particle.x - radius <
                    bounds.xMin
                ) {
                    particle.x =
                        bounds.xMin + radius;
                    particle.velocityX =
                        Math.abs(
                            particle.velocityX,
                        );
                } else if (
                    particle.x + radius >
                    bounds.xMax
                ) {
                    particle.x =
                        bounds.xMax - radius;
                    particle.velocityX =
                        -Math.abs(
                            particle.velocityX,
                        );
                }

                if (
                    particle.y - radius <
                    bounds.yMin
                ) {
                    particle.y =
                        bounds.yMin + radius;
                    particle.velocityY =
                        Math.abs(
                            particle.velocityY,
                        );
                } else if (
                    particle.y + radius >
                    bounds.yMax
                ) {
                    particle.y =
                        bounds.yMax - radius;
                    particle.velocityY =
                        -Math.abs(
                            particle.velocityY,
                        );
                }
                return;
            }

            case "recycle":
                if (
                    particle.x + radius <
                        bounds.xMin ||
                    particle.x - radius >
                        bounds.xMax ||
                    particle.y + radius <
                        bounds.yMin ||
                    particle.y - radius >
                        bounds.yMax
                ) {
                    this.recycleOrDeactivate(
                        particle,
                        index,
                        slotIndex,
                    );
                }
        }
    }

    private recycleOrDeactivate(
        particle: FreeParticle,
        index: number,
        slotIndex: number,
    ) {
        if (
            this.boundary === "recycle" ||
            this.pool.activeCount <=
                this.targetCount
        ) {
            resetFreeParticle(particle);
            this.initialize(
                particle,
                index,
            );
            normalizeParticle(particle);
            return;
        }

        this.pool.deactivate(slotIndex);
    }

    private maintainTargetCount() {
        while (
            this.pool.activeCount <
                this.targetCount &&
            this.pool.remainingCapacity > 0
        ) {
            this.spawn();
        }
    }
}

function createFreeParticle(): FreeParticle {
    return {
        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        radius: 1,
        mass: 1,
        age: 0,
        lifetime: Number.POSITIVE_INFINITY,
        alpha: 1,
    };
}

function resetFreeParticle(
    particle: FreeParticle,
) {
    particle.x = 0;
    particle.y = 0;
    particle.velocityX = 0;
    particle.velocityY = 0;
    particle.radius = 1;
    particle.mass = 1;
    particle.age = 0;
    particle.lifetime =
        Number.POSITIVE_INFINITY;
    particle.alpha = 1;
}

function normalizeParticle(
    particle: FreeParticle,
) {
    particle.radius = Math.max(
        0,
        particle.radius,
    );
    particle.mass = Math.max(
        Number.EPSILON,
        particle.mass,
    );
    particle.alpha = clamp(
        particle.alpha,
        0,
        1,
    );
}

function resolveCircleCollision(
    first: FreeParticle,
    second: FreeParticle,
    restitution: number,
) {
    const differenceX =
        second.x - first.x;
    const differenceY =
        second.y - first.y;
    const minimumDistance =
        first.radius + second.radius;
    const distanceSquared =
        differenceX * differenceX +
        differenceY * differenceY;

    if (
        distanceSquared <= 0 ||
        distanceSquared >=
            minimumDistance *
                minimumDistance
    ) {
        return;
    }

    const distance = Math.sqrt(
        distanceSquared,
    );
    const normalX =
        differenceX / distance;
    const normalY =
        differenceY / distance;
    const overlap =
        minimumDistance - distance;

    const inverseMassFirst =
        1 / first.mass;
    const inverseMassSecond =
        1 / second.mass;
    const inverseMassSum =
        inverseMassFirst +
        inverseMassSecond;

    first.x -=
        normalX *
        overlap *
        (inverseMassFirst /
            inverseMassSum);
    first.y -=
        normalY *
        overlap *
        (inverseMassFirst /
            inverseMassSum);
    second.x +=
        normalX *
        overlap *
        (inverseMassSecond /
            inverseMassSum);
    second.y +=
        normalY *
        overlap *
        (inverseMassSecond /
            inverseMassSum);

    const relativeVelocityX =
        second.velocityX -
        first.velocityX;
    const relativeVelocityY =
        second.velocityY -
        first.velocityY;
    const speedAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    if (speedAlongNormal >= 0) {
        return;
    }

    const impulseMagnitude =
        -(1 + restitution) *
        speedAlongNormal /
        inverseMassSum;

    const impulseX =
        impulseMagnitude * normalX;
    const impulseY =
        impulseMagnitude * normalY;

    first.velocityX -=
        impulseX * inverseMassFirst;
    first.velocityY -=
        impulseY * inverseMassFirst;
    second.velocityX +=
        impulseX * inverseMassSecond;
    second.velocityY +=
        impulseY * inverseMassSecond;
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
