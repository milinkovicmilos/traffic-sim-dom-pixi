import type { Vector2 } from './vector2';

export class Angle {
    /**
     * Converts degrees to radians
     */
    static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Converts radians to degrees
     */
    static toDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * Calculates the angle in radians from a 2D vector relative to the positive X-axis.
     * Returns a value in the range [-π, π].
     */
    static fromVector(vector: Vector2): number {
        return Math.atan2(vector.y, vector.x);
    }

    /**
     * Normalizes an angle in radians into the range [0, 2π).
     * Correctly handles negative angles and multi-turn values.
     */
    static normalize(radians: number): number {
        const twoPi = Math.PI * 2;
        return ((radians % twoPi) + twoPi) % twoPi;
    }

    /**
     * Normalizes an angle in radians into the signed range [-π, π).
     */
    static normalizeSigned(radians: number): number {
        const normalized = Angle.normalize(radians);
        return normalized > Math.PI ? normalized - Math.PI * 2 : normalized;
    }

    /**
     * Normalizes an angle in degrees into the range [0, 360).
     */
    static normalizeDegrees(degrees: number): number {
        return ((degrees % 360) + 360) % 360;
    }

    /**
     * Normalizes an angle in degrees into the signed range [-180, 180).
     */
    static normalizeSignedDegrees(degrees: number): number {
        const normalized = Angle.normalizeDegrees(degrees);
        return normalized > 180 ? normalized - 360 : normalized;
    }

    /**
     * Calculates the shortest angular difference between two angles in radians.
     * Returns a value in the range [-π, π].
     */
    static difference(fromRadians: number, toRadians: number): number {
        return Angle.normalizeSigned(toRadians - fromRadians);
    }

    /**
     * Linearly interpolates between two angles in radians along the shortest path.
     * `t` is typically clamped between 0 and 1.
     */
    static lerp(fromRadians: number, toRadians: number, t: number): number {
        const diff = Angle.difference(fromRadians, toRadians);
        return Angle.normalize(fromRadians + diff * t);
    }
}
