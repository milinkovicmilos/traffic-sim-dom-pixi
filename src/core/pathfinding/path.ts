import type { Lane } from '@core/map/lane';
import type { Movement } from '@core/traffic/movement';
import { PathLocation } from './pathlocation';
import type { Vector2 } from '@shared/utils/math/vector2';
import { MathUtils } from '@shared/utils/math/math-utils';

export class Path {
    private readonly startLocation: PathLocation;
    private readonly endLocation: PathLocation;
    private readonly lanes: readonly Lane[];
    private readonly movements: readonly Movement[];

    /*
     * Path distance at which each lane begins.
     *
     * Example:
     *
     * lane 0 starts at 0
     * lane 1 starts at remaining length of lane 0
     * lane 2 starts at remaining length of lane 0 + lane 1
     *
     * This avoids repeatedly walking through all preceding lanes.
     */
    private readonly laneStartDistances: readonly number[];

    /*
     * Path distance at which each movement begins.
     *
     * movement[i] is the transition from lanes[i] to lanes[i + 1].
     */
    private readonly movementDistances: readonly number[];

    /*
     * Effective distance available on each lane within this path.
     *
     * The first lane starts at startLocation.getDistance().
     * The last lane ends at endLocation.getDistance().
     * Intermediate lanes use their full length.
     */
    private readonly lanePathLengths: readonly number[];

    private readonly totalLength: number;

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

        const laneStartDistances = new Array<number>(lanes.length);
        const lanePathLengths = new Array<number>(lanes.length);
        const movementDistances = new Array<number>(movements.length);

        let pathDistance = 0;

        for (let i = 0; i < lanes.length; i++) {
            const lane = lanes[i];

            laneStartDistances[i] = pathDistance;

            let effectiveLength: number;

            if (i === 0) {
                effectiveLength = lane.getLength() - start.getDistance();
            } else if (i === lanes.length - 1) {
                effectiveLength = end.getDistance();
            } else {
                effectiveLength = lane.getLength();
            }

            effectiveLength = Math.max(0, effectiveLength);

            lanePathLengths[i] = effectiveLength;

            if (i < movements.length) {
                movementDistances[i] = pathDistance + effectiveLength;
            }

            pathDistance += effectiveLength;
        }

        this.laneStartDistances = laneStartDistances;
        this.lanePathLengths = lanePathLengths;
        this.movementDistances = movementDistances;
        this.totalLength = Math.max(0, pathDistance);
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
     * Returns the total distance of the path.
     *
     * Cached because the path is immutable.
     */
    getTotalLength(): number {
        return this.totalLength;
    }

    /**
     * Returns the lane and distance along that lane for a given
     * distance travelled along the path.
     */
    getPathLocationAtDistance(distance: number): PathLocation {
        const clampedDistance = MathUtils.clamp(distance, 0, this.totalLength);

        const laneIndex = this.getLaneIndexAtDistance(clampedDistance);

        const laneStartDistance = this.laneStartDistances[laneIndex];

        const laneDistance =
            this.lanes.length === 1 && laneIndex === 0
                ? this.startLocation.getDistance() + clampedDistance
                : laneIndex === 0
                  ? this.startLocation.getDistance() + (clampedDistance - laneStartDistance)
                  : clampedDistance - laneStartDistance;

        return new PathLocation(
            this.lanes[laneIndex],
            Math.min(laneDistance, this.lanes[laneIndex].getLength()),
        );
    }

    /**
     * Returns the index of the lane occupied at a given
     * path distance.
     *
     * Binary search keeps this inexpensive for longer paths.
     */
    getLaneIndexAtDistance(distance: number): number {
        if (this.lanes.length === 1) {
            return 0;
        }

        const clampedDistance = MathUtils.clamp(distance, 0, this.totalLength);

        let low = 0;
        let high = this.lanes.length - 1;

        while (low < high) {
            const mid = Math.floor((low + high + 1) / 2);

            if (this.laneStartDistances[mid] <= clampedDistance) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        /*
         * At an exact lane boundary, retain the previous lane.
         * This preserves the semantics of getPathLocationAtDistance().
         */
        if (
            low > 0 &&
            Math.abs(clampedDistance - this.laneStartDistances[low]) <= MathUtils.epsilon
        ) {
            return low - 1;
        }

        return low;
    }

    /**
     * Returns the total path distance corresponding to a
     * position on one of this path's lanes.
     *
     * Returns null if the lane isn't part of the path or if the
     * position is outside the portion of the lane represented by
     * this path.
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

            if (pathDistance < -MathUtils.epsilon) {
                return null;
            }

            if (pathDistance > this.lanePathLengths[0] + MathUtils.epsilon) {
                return null;
            }

            return Math.max(0, pathDistance);
        }

        const laneStartDistance = this.laneStartDistances[laneIndex];

        const pathDistance = laneStartDistance + laneDistance;

        /*
         * The final lane may end before its physical lane end
         * because the destination is inside it.
         */
        if (laneDistance > this.lanePathLengths[laneIndex] + MathUtils.epsilon) {
            return null;
        }

        return pathDistance;
    }

    /**
     * Returns the point of the vehicle based on its distance
     * travelled along this path.
     */
    getPositionAtDistance(distance: number): Vector2 {
        const pathLocation = this.getPathLocationAtDistance(distance);

        return pathLocation.getPoint();
    }

    /**
     * Returns the movement currently ahead of the given
     * path distance.
     */
    getNextMovement(distance: number): Movement | null {
        const laneIndex = this.getLaneIndexAtDistance(distance);

        if (laneIndex >= this.movements.length) {
            return null;
        }

        return this.movements[laneIndex];
    }

    /**
     * Returns the distance along the path at which a movement
     * begins.
     */
    getMovementDistance(movement: Movement): number | null {
        const movementIndex = this.movements.indexOf(movement);

        if (movementIndex === -1) {
            return null;
        }

        return this.movementDistances[movementIndex];
    }

    /**
     * Faster index-based variant for callers that already know
     * the movement's position in the path.
     */
    getMovementDistanceAtIndex(movementIndex: number): number | null {
        if (movementIndex < 0 || movementIndex >= this.movementDistances.length) {
            return null;
        }

        return this.movementDistances[movementIndex];
    }

    /**
     * Returns the distance to a movement from the current
     * travelled distance.
     */
    getDistanceToMovement(travelledDistance: number, movement: Movement): number | null {
        const movementDistance = this.getMovementDistance(movement);

        if (movementDistance === null) {
            return null;
        }

        return movementDistance - travelledDistance;
    }
}
