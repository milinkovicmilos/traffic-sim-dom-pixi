export function average(values: readonly number[]): number {
    if (values.length === 0) {
        return 0;
    }

    let total = 0;

    for (const value of values) {
        total += value;
    }

    return total / values.length;
}

export function percentile(values: readonly number[], percentile: number): number {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);

    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
        return sorted[lower];
    }

    const weight = index - lower;

    return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}
