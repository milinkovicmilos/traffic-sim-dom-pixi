export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        if (!Number.isFinite(seed)) {
            throw new Error('SeededRandom seed must be a finite number.');
        }

        // Convert the seed into a deterministic unsigned 32-bit state.
        this.state = Math.trunc(seed) >>> 0;
    }

    /**
     * Returns a deterministic floating-point value in [0, 1).
     */
    next(): number {
        // Mulberry32-style generator.
        this.state = (this.state + 0x6d2b79f5) >>> 0;

        let value = this.state;

        value = Math.imul(value ^ (value >>> 15), value | 1);

        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

        value ^= value >>> 14;

        // Divide by 2^32 to produce [0, 1).
        return (value >>> 0) / 4294967296;
    }

    /**
     * Returns an integer in the inclusive range [min, max].
     */
    nextInt(min: number, max: number): number {
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            throw new Error('SeededRandom.nextInt() requires integer bounds.');
        }

        if (max < min) {
            throw new Error('SeededRandom.nextInt() requires max >= min.');
        }

        if (min === max) {
            return min;
        }

        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns a deterministic boolean.
     */
    nextBoolean(): boolean {
        return this.next() < 0.5;
    }

    /**
     * Returns one element from a non-empty array.
     */
    pick<T>(values: readonly T[]): T {
        if (values.length === 0) {
            throw new Error('SeededRandom.pick() cannot choose from an empty array.');
        }

        return values[this.nextInt(0, values.length - 1)];
    }

    /**
     * Returns the current internal state.
     *
     * Useful later if we want to save/restore benchmark runs.
     */
    getState(): number {
        return this.state >>> 0;
    }

    /**
     * Restores a previously captured state.
     */
    setState(state: number): void {
        if (!Number.isInteger(state)) {
            throw new Error('SeededRandom state must be an integer.');
        }

        this.state = state >>> 0;
    }
}
