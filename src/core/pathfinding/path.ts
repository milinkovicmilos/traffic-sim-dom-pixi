import type { Lane } from '@core/map/lane';
import type { Movement } from '@core/traffic/movement';
import { PathLocation } from './pathlocation';
import type { Vector2 } from '@shared/utils/math/vector2';
import { MathUtils } from '@shared/utils/math/math-utils';

export class Path {
    private readonly startLocation: PathLocation;
    private readonly endLocation: PathLocation;
    private readonly lanes: Lane[];
    private readonly movements: Movement[];

    constructor(start: PathLocation, end: PathLocation, lanes: Lane[], movements: Movement[]) {
        if (lanes.length === 0) {
            throw new Error('Path must contain at least one lane.');
        }

        if (movements.length !== lanes.length - 1) {
            throw new Error('A path must contain exactly one movement between each pair of lanes.');
        }

        if (lanes[0] !== start.getLane()) {
            throw new Error('Path start location must belong to the first lane.');
        }

        if (lanes[lanes.length - 1] !== end.getLane()) {
            throw new Error('Path end location must belong to the last lane.');
        }

        this.startLocation = start;
        this.endLocation = end;
        this.lanes = lanes;
        this.movements = movements;
    }

    getStartLocation(): PathLocation {
        return this.startLocation;
    }

    getEndLocation(): PathLocation {
        return this.endLocation;
    }

    getStartLane(): Lane {
        return this.startLocation.getLane();
    }

    getEndLane(): Lane {
        return this.endLocation.getLane();
    }

    getLanes(): readonly Lane[] {
        return this.lanes;
    }

    getMovements(): readonly Movement[] {
        return this.movements;
    }

    /**
     * Returns the total distance of the path from start to destination.
     */
    getTotalLength(): number {
        if (this.lanes.length === 1) {
            return Math.max(0, this.endLocation.getDistance() - this.startLocation.getDistance());
        }

        let totalLength = this.startLocation.getFullLaneLength() - this.startLocation.getDistance();

        for (let i = 1; i < this.lanes.length - 1; i++) {
            totalLength += this.lanes[i].getLength();
        }

        totalLength += this.endLocation.getDistance();

        return Math.max(0, totalLength);
    }

    /**
     * Returns the lane and distance along that lane for a given
     * distance travelled along this path.
     */
    getPathLocationAtDistance(distance: number): PathLocation {
        const totalLength = this.getTotalLength();

        const clampedDistance = MathUtils.clamp(distance, 0, totalLength);

        if (this.lanes.length === 1) {
            return new PathLocation(
                this.lanes[0],
                this.startLocation.getDistance() + clampedDistance,
            );
        }

        let remainingDistance = clampedDistance;

        const firstLane = this.lanes[0];

        const firstLaneDistance = firstLane.getLength() - this.startLocation.getDistance();

        if (remainingDistance <= firstLaneDistance) {
            return new PathLocation(
                firstLane,
                this.startLocation.getDistance() + remainingDistance,
            );
        }

        remainingDistance -= firstLaneDistance;

        for (let i = 1; i < this.lanes.length - 1; i++) {
            const lane = this.lanes[i];

            const laneLength = lane.getLength();

            if (remainingDistance <= laneLength) {
                return new PathLocation(lane, remainingDistance);
            }

            remainingDistance -= laneLength;
        }

        const finalLane = this.lanes[this.lanes.length - 1];

        return new PathLocation(
            finalLane,
            Math.min(remainingDistance, this.endLocation.getDistance()),
        );
    }

    /**
     * Returns the total path distance corresponding to a
     * position on one of this path's lanes.
     *
     * Returns null when the lane is not part of this path or
     * when the requested position lies before this path begins.
     */
    getPathDistanceAtLaneDistance(lane: Lane, laneDistance: number): number | null {
        const laneIndex = this.lanes.indexOf(lane);

        if (laneIndex === -1) {
            return null;
        }

        if (
            laneDistance < -MathUtils.epsilon ||
            laneDistance > lane.getLength() + MathUtils.epsilon
        ) {
            return null;
        }

        if (laneIndex === 0) {
            const pathDistance = laneDistance - this.startLocation.getDistance();

            /*
             * A vehicle located before our path's start cannot
             * be projected onto this path.
             */
            if (pathDistance < -MathUtils.epsilon) {
                return null;
            }

            return Math.max(0, pathDistance);
        }

        let distance = this.lanes[0].getLength() - this.startLocation.getDistance();

        for (let i = 1; i < laneIndex; i++) {
            distance += this.lanes[i].getLength();
        }

        return distance + laneDistance;
    }

    /**
     * Returns the position of the vehicle based on its distance
     * travelled along this path.
     */
    getPositionAtDistance(distance: number): Vector2 {
        const pathLocation = this.getPathLocationAtDistance(distance);

        return pathLocation.getPoint();
    }

    /**
     * Returns the next movement the vehicle has to traverse.
     *
     * The movement belongs to the boundary between the current
     * lane and the next lane.
     */
    getNextMovement(distance: number): Movement | null {
        const pathLocation = this.getPathLocationAtDistance(distance);

        const laneIndex = this.lanes.indexOf(pathLocation.getLane());

        if (laneIndex === -1) {
            throw new Error('Current lane not found in path.');
        }

        if (laneIndex >= this.movements.length) {
            return null;
        }

        return this.movements[laneIndex];
    }

    /**
     * Returns the path distance at which the movement begins.
     */
    getMovementDistance(movement: Movement): number | null {
        const movementIndex = this.movements.indexOf(movement);

        if (movementIndex === -1) {
            return null;
        }

        let distance = this.lanes[0].getLength() - this.startLocation.getDistance();

        for (let i = 1; i <= movementIndex; i++) {
            distance += this.lanes[i].getLength();
        }

        return distance;
    }

    /**
     * Returns the distance from the vehicle to the movement.
     */
    getDistanceToMovement(travelledDistance: number, movement: Movement): number | null {
        const movementDistance = this.getMovementDistance(movement);

        if (movementDistance === null) {
            return null;
        }

        return movementDistance - travelledDistance;
    }
}
