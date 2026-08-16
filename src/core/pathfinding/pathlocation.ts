import type { Lane } from '@core/map/lane';
import type { Vector2 } from '@shared/utils/math/vector2';

export class PathLocation {
    private readonly lane: Lane;
    private readonly distance: number;

    constructor(lane: Lane, distance: number) {
        if (distance < 0 || distance > lane.getLength()) {
            throw new Error('PathLocation distance must be within the lane.');
        }

        this.lane = lane;
        this.distance = distance;
    }

    getLane(): Lane {
        return this.lane;
    }

    getDistance(): number {
        return this.distance;
    }

    getFullLaneLength(): number {
        return this.lane.getLength();
    }

    getPoint(): Vector2 {
        return this.lane.getPosition(this.distance);
    }
}
