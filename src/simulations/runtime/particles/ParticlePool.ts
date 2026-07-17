export interface ParticleSlot<Value> {
    readonly index: number;
    active: boolean;
    readonly value: Value;
}

/**
 * Fixed-capacity object pool. Values and slots are allocated once and reused,
 * so spawning and recycling particles does not grow memory over time.
 */
export class ParticlePool<Value> {
    readonly capacity: number;

    private readonly slots:
        ParticleSlot<Value>[];

    private readonly freeIndices:
        number[];

    private activeCountValue = 0;

    constructor(
        capacity: number,
        createValue: (
            index: number,
        ) => Value,
    ) {
        this.capacity = Math.max(
            0,
            Math.floor(capacity),
        );

        this.slots = Array.from(
            {
                length: this.capacity,
            },
            (_, index) => ({
                index,
                active: false,
                value: createValue(index),
            }),
        );

        this.freeIndices = Array.from(
            {
                length: this.capacity,
            },
            (_, index) =>
                this.capacity - index - 1,
        );
    }

    get activeCount(): number {
        return this.activeCountValue;
    }

    get remainingCapacity(): number {
        return this.freeIndices.length;
    }


    getActiveValue(
        index: number,
    ): Value | undefined {
        const slot = this.slots[index];

        return slot?.active
            ? slot.value
            : undefined;
    }

    activate(
        initialize?: (
            value: Value,
            index: number,
        ) => void,
    ): ParticleSlot<Value> | undefined {
        const index =
            this.freeIndices.pop();

        if (index === undefined) {
            return undefined;
        }

        const slot = this.slots[index];
        slot.active = true;
        this.activeCountValue++;
        initialize?.(slot.value, index);

        return slot;
    }

    deactivate(
        slotOrIndex:
            | ParticleSlot<Value>
            | number,
    ) {
        const index =
            typeof slotOrIndex === "number"
                ? slotOrIndex
                : slotOrIndex.index;

        const slot = this.slots[index];

        if (!slot?.active) {
            return;
        }

        slot.active = false;
        this.activeCountValue--;
        this.freeIndices.push(index);
    }

    clear(
        reset?: (
            value: Value,
            index: number,
        ) => void,
    ) {
        this.freeIndices.length = 0;

        for (let index = 0;
            index < this.slots.length;
            index++) {
            const slot = this.slots[index];

            if (slot.active) {
                reset?.(
                    slot.value,
                    index,
                );
            }

            slot.active = false;
        }

        for (
            let index = this.capacity - 1;
            index >= 0;
            index--
        ) {
            this.freeIndices.push(index);
        }

        this.activeCountValue = 0;
    }

    forEachActive(
        callback: (
            value: Value,
            index: number,
            slot: ParticleSlot<Value>,
        ) => void,
    ) {
        for (const slot of this.slots) {
            if (slot.active) {
                callback(
                    slot.value,
                    slot.index,
                    slot,
                );
            }
        }
    }

    forEachActivePair(
        callback: (
            first: Value,
            second: Value,
            firstIndex: number,
            secondIndex: number,
        ) => void,
    ) {
        for (
            let firstIndex = 0;
            firstIndex < this.slots.length;
            firstIndex++
        ) {
            const first =
                this.slots[firstIndex];

            if (!first.active) {
                continue;
            }

            for (
                let secondIndex =
                    firstIndex + 1;
                secondIndex <
                    this.slots.length;
                secondIndex++
            ) {
                const second =
                    this.slots[secondIndex];

                if (!second.active) {
                    continue;
                }

                callback(
                    first.value,
                    second.value,
                    firstIndex,
                    secondIndex,
                );
            }
        }
    }
}
