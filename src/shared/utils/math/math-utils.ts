export class MathUtils {
    static readonly epsilon = 0.001;

    /**
     * Clamps a value between a minimum and maximum threshold.
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linearly interpolates between `a` and `b` by factor `t`.
     */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
     * Checks if two scalar values are virtually equal within an epsilon tolerance.
     */
    static nearlyEqual(a: number, b: number, epsilon = 1e-5): boolean {
        return Math.abs(a - b) <= epsilon;
    }
}
