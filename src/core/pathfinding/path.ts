import type { Lane } from '@core/map/lane';
import type { Movement } from '@core/traffic/movement';
import { PathLocation } from './pathlocation';

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
}
