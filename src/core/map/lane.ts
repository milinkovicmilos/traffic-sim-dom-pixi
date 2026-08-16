import { Angle } from '@shared/utils/math/angle';
import { MathUtils } from '@shared/utils/math/math-utils';
import type { Vector2 } from '@shared/utils/math/vector2';
import type { RoadNode } from './road-node';

export class Lane {
    private readonly id: number;
    private readonly startNode: RoadNode;
    private readonly endNode: RoadNode;

    constructor(id: number, start: RoadNode, end: RoadNode) {
        if (start.equals(end)) {
            throw new Error('Lane can not start and end on the same node');
        }

        this.id = id;
        this.startNode = start;
        this.endNode = end;
    }

    getId(): number {
        return this.id;
    }

    getStartNode(): RoadNode {
        return this.startNode;
    }

    getStartPosition(): Vector2 {
        return this.startNode.getPosition();
    }

    getEndNode(): RoadNode {
        return this.endNode;
    }

    getEndPosition(): Vector2 {
        return this.endNode.getPosition();
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
     * Returns the position along the lane from start with the given distance
     *
     * @param {number} distance - Distance from the start of the lane
     */
    getPosition(distance: number): Vector2 {
        const laneLength = this.getLength();

        // Clamp distance so vehicles don't move outside [0, laneLength]
        const clampedDistance = MathUtils.clamp(0, distance, laneLength);

        // Get the direction unit vector
        const unitVector = this.getStartPosition().unitVectorTo(this.getEndPosition());

        // Start point + (direction * distance)
        return this.getStartPosition().add(unitVector.multiplyByScalar(clampedDistance));
    }
}
