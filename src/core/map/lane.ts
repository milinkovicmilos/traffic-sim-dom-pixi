import { Angle } from '@shared/utils/math/angle';
import { MathUtils } from '@shared/utils/math/math-utils';
import type { Vector2 } from '@shared/utils/math/vector2';

export class Lane {
    private readonly id: number;
    private readonly start: Vector2;
    private readonly end: Vector2;

    constructor(id: number, start: Vector2, end: Vector2) {
        if (start.equals(end)) {
            throw new Error('The start and the end of the lane cannot be in the same point');
        }

        this.id = id;
        this.start = start;
        this.end = end;
    }

    getId(): number {
        return this.id;
    }

    getLength(): number {
        return this.start.distanceTo(this.end);
    }

    /**
     * Returns the rotation (heading) of the lane
     */
    getRotation(): number {
        const direction = this.end.subtract(this.start);
        return Angle.fromVector(direction);
    }

    /**
     * Returns the point along the lane from start with the given distance
     */
    getPoint(distance: number): Vector2 {
        const laneLength = this.getLength();

        // Clamp distance so vehicles don't move outside [0, laneLength]
        const clampedDistance = MathUtils.clamp(0, distance, laneLength);

        // Get the direction unit vector
        const unitVector = this.start.unitVectorTo(this.end);

        // Start point + (direction * distance)
        return this.start.add(unitVector.multiplyByScalar(clampedDistance));
    }
}
