import type { Lane } from '@core/map/lane';
import type { Movement } from '@core/traffic/movement';
import type { PathLocation } from './pathlocation';
import { MathUtils } from '@shared/utils/math/math-utils';

export class Path {
    private readonly lanes: Lane[];
    private readonly movements: Movement[];

    // Distance from the starting point of the lane to the starting position on the lane
    private readonly startDistance: number;

    // Distance from the starting point of the lane to the destination point on the lane
    private readonly endDistance: number;

    constructor(lanes: Lane[], movements: Movement[], startDistance: number, endDistance: number) {
        if (lanes.length === 0) {
            throw new Error('Path must contain at least one lane.');
        }

        if (movements.length !== lanes.length - 1) {
            throw new Error('A path must contain exactly one movement between each pair of lanes.');
        }

        if (startDistance < 0) {
            throw new Error('Start distance cannot be negative.');
        }

        if (endDistance < 0) {
            throw new Error('End distance cannot be negative.');
        }

        this.lanes = lanes;
        this.movements = movements;
        this.startDistance = startDistance;
        this.endDistance = endDistance;
    }

    getLanes(): readonly Lane[] {
        return this.lanes;
    }

    getMovements(): readonly Movement[] {
        return this.movements;
    }

    getStartDistance(): number {
        return this.startDistance;
    }

    getEndDistance(): number {
        return this.endDistance;
    }

    /**
     * Returns the total distance of the path from start to destination
     */
    getTotalLength(): number {
        // If start and end is on the same lane, we just subtract the distances
        if (this.lanes.length === 1) {
            return Math.max(0, this.endDistance - this.startDistance);
        }

        // Else we get the total distance of the first lane
        let length = this.lanes[0].getLength() - this.startDistance;

        // add up the length of the rest of the lanes, except the last one
        for (let i = 1; i < this.lanes.length - 1; i++) {
            length += this.lanes[i].getLength();
        }

        // and add the distance along the last lane
        length += this.endDistance;

        return length;
    }

    /**
     * Return the path location from the starting point
     *
     * @param {number} distance - Distance from the starting point of the path
     */
    getLocationAtDistance(distance: number): PathLocation {
        const totalLength = this.getTotalLength();

        const clampedDistance = MathUtils.clamp(0, distance, totalLength);

        if (this.lanes.length === 1) {
            return {
                lane: this.lanes[0],
                distance: clampedDistance,
            };
        }

        const firstLaneDistance = this.lanes[0].getLength() - this.startDistance;

        if (clampedDistance <= firstLaneDistance) {
            return {
                lane: this.lanes[0],
                distance: this.startDistance + clampedDistance,
            };
        }

        let remaining = clampedDistance - firstLaneDistance;

        for (let i = 1; i < this.lanes.length - 1; i++) {
            const lane = this.lanes[i];
            const laneLength = lane.getLength();

            if (remaining <= laneLength) {
                return {
                    lane,
                    distance: remaining,
                };
            }
        }

        const finalLane = this.lanes[this.lanes.length - 1];

        return {
            lane: finalLane,
            distance: Math.min(remaining, this.endDistance),
        };
    }
}
