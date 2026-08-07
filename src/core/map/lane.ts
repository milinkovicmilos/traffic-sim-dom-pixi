import { Angle } from '@shared/utils/math/angle';
import { MathUtils } from '@shared/utils/math/math-utils';
import type { Vector2 } from '@shared/utils/math/vector2';
import type { Intersection } from './intersection';

export class Lane {
    private readonly id: number;
    private readonly startIntersection: Intersection;
    private readonly endIntersection: Intersection;

    constructor(id: number, start: Intersection, end: Intersection) {
        if (start.equals(end)) {
            throw new Error('Lane can not start and end on the same intersection');
        }

        this.id = id;
        this.startIntersection = start;
        this.endIntersection = end;
    }

    getId(): number {
        return this.id;
    }

    getStartIntersection(): Intersection {
        return this.startIntersection;
    }

    getStartPosition(): Vector2 {
        return this.startIntersection.getPosition();
    }

    getEndIntersection(): Intersection {
        return this.endIntersection;
    }

    getEndPosition(): Vector2 {
        return this.endIntersection.getPosition();
    }

    /**
     * Returns the length of the lane
     */
    getLength(): number {
        return this.getStartPosition().distanceTo(this.getEndPosition());
    }

    /**
     * Returns the rotation (heading) of the lane
     */
    getRotation(): number {
        const direction = this.getEndPosition().subtract(this.getStartPosition());

        return Angle.fromVector(direction);
    }

    /**
     * Returns the point along the lane from start with the given distance
     *
     * @param {number} distance - Distance from the start of the lane
     */
    getPoint(distance: number): Vector2 {
        const laneLength = this.getLength();

        // Clamp distance so vehicles don't move outside [0, laneLength]
        const clampedDistance = MathUtils.clamp(0, distance, laneLength);

        // Get the direction unit vector
        const unitVector = this.getStartPosition().unitVectorTo(this.getEndPosition());

        // Start point + (direction * distance)
        return this.getStartPosition().add(unitVector.multiplyByScalar(clampedDistance));
    }
}
