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
     * Returns the total distance of the path from start to destination
     */
    getTotalLength(): number {
        // If start and end is on the same lane, we just subtract the distances
        if (this.lanes.length === 1) {
            return Math.max(0, this.endLocation.getDistance() - this.startLocation.getDistance());
        }

        // Else we get the total distance of the first lane
        let totalLength = this.startLocation.getFullLaneLength() - this.startLocation.getDistance();

        // add up the length of the rest of the lanes, except the last one
        for (let i = 1; i < this.lanes.length - 1; i++) {
            totalLength += this.lanes[i].getLength();
        }

        // and add the distance along the last lane
        totalLength += this.endLocation.getDistance();

        return totalLength;
    }

    /**
     * Returns the lane and distance along that lane for a given
     * distance travelled along this path.
     *
     * @param distance - The distance travelled along the path
     */
    getLaneAtDistance(distance: number): { lane: Lane; laneDistance: number } {
        const totalLength = this.getTotalLength();
        const clampedDistance = MathUtils.clamp(0, distance, totalLength);

        if (this.lanes.length === 1) {
            return {
                lane: this.lanes[0],
                laneDistance: this.startLocation.getDistance() + clampedDistance,
            };
        }

        let remainingDistance = clampedDistance;

        const firstLane = this.lanes[0];
        const firstLaneDistance = firstLane.getLength() - this.startLocation.getDistance();

        if (remainingDistance <= firstLaneDistance) {
            return {
                lane: firstLane,
                laneDistance: this.startLocation.getDistance() + remainingDistance,
            };
        }

        remainingDistance -= firstLaneDistance;

        for (let i = 1; i < this.lanes.length - 1; i++) {
            const lane = this.lanes[i];
            const laneLength = lane.getLength();

            if (remainingDistance <= laneLength) {
                return {
                    lane,
                    laneDistance: remainingDistance,
                };
            }

            remainingDistance -= laneLength;
        }

        const finalLane = this.lanes[this.lanes.length - 1];

        return {
            lane: finalLane,
            laneDistance: Math.min(remainingDistance, this.endLocation.getDistance()),
        };
    }

    /**
     * Returns the point of the vehicle based on its distance traveled along this path
     *
     * @param {number} distance - The distance that the vehicle has traveled along this path
     */
    getPositionAtDistance(distance: number): Vector2 {
        const laneInfo = this.getLaneAtDistance(distance);

        return laneInfo.lane.getPosition(laneInfo.laneDistance);
    }

    /**
     * Returns the next movement the vehicle has to traverse.
     *
     * @param distance Distance travelled along the path.
     * @returns The next movement, or null if there is none.
     */
    getNextMovement(distance: number): Movement | null {
        const laneInfo = this.getLaneAtDistance(distance);

        const laneIndex = this.lanes.indexOf(laneInfo.lane);

        if (laneIndex === -1) {
            throw new Error('Current lane not found in path.');
        }

        if (laneIndex >= this.movements.length) {
            return null;
        }

        return this.movements[laneIndex];
    }
}
