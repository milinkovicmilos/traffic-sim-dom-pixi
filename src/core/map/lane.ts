import { Angle } from '@shared/utils/math/angle';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Vector2 } from '@shared/utils/math/vector2';
import type { RoadNode } from './road-node';
import type { Road } from './road';

export class Lane {
    private readonly id: number;

    private readonly startNode: RoadNode;
    private readonly endNode: RoadNode;
    private readonly road: Road;

    /**
     * Distance from the underlying road centerline to the
     * center of this lane.
     *
     * Positive means "to the right of the lane's direction
     * of travel".
     */
    private readonly lateralOffset: number;

    constructor(id: number, start: RoadNode, end: RoadNode, road: Road, lateralOffset: number = 0) {
        if (start.equals(end)) {
            throw new Error('Lane can not start and end on the same node');
        }

        this.id = id;
        this.startNode = start;
        this.endNode = end;
        this.road = road;
        this.lateralOffset = lateralOffset;
    }

    getId(): number {
        return this.id;
    }

    getStartNode(): RoadNode {
        return this.startNode;
    }

    getEndNode(): RoadNode {
        return this.endNode;
    }

    getRoad(): Road {
        return this.road;
    }

    /**
     * Returns the center position of the lane at its
     * starting node.
     */
    getStartPosition(): Vector2 {
        return this.getOffsetPosition(this.startNode.getPosition());
    }

    /**
     * Returns the center position of the lane at its
     * ending node.
     */
    getEndPosition(): Vector2 {
        return this.getOffsetPosition(this.endNode.getPosition());
    }

    /**
     * Returns the perpendicular distance from the road
     * centerline to this lane's centerline.
     */
    getLateralOffset(): number {
        return this.lateralOffset;
    }

    /**
     * Returns the length of the lane.
     */
    getLength(): number {
        return this.startNode.getPosition().distanceTo(this.endNode.getPosition());
    }

    /**
     * Returns the rotation/heading of the lane.
     */
    getRotation(): number {
        const direction = this.getEndPosition().subtract(this.getStartPosition());

        return Angle.fromVector(direction);
    }

    /**
     * Returns a position along the lane.
     *
     * The returned point is always on the lane's centerline,
     * not on the underlying road centerline.
     */
    getPosition(distance: number): Vector2 {
        const laneLength = this.getLength();

        const clampedDistance = MathUtils.clamp(0, distance, laneLength);

        const start = this.getStartPosition();

        const end = this.getEndPosition();

        const direction = start.unitVectorTo(end);

        return start.add(direction.multiplyByScalar(clampedDistance));
    }

    /**
     * Moves a position to the right-hand side of this lane's
     * direction of travel.
     */
    private getOffsetPosition(position: Vector2): Vector2 {
        if (this.lateralOffset === 0) {
            return position;
        }

        const roadStart = this.startNode.getPosition();

        const roadEnd = this.endNode.getPosition();

        const dx = roadEnd.x - roadStart.x;

        const dy = roadEnd.y - roadStart.y;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return position;
        }

        /*
         * Unit vector pointing to the right side of the
         * current direction of travel.
         *
         * In screen coordinates:
         *
         * direction → (dx, dy)
         * right     → (-dy, dx)
         */
        const rightX = -dy / length;

        const rightY = dx / length;

        return new Vector2(
            position.x + rightX * this.lateralOffset,
            position.y + rightY * this.lateralOffset,
        );
    }
}
