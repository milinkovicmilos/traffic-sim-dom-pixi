import type { Path } from '@core/pathfinding/path';
import type { Vector2 } from '@shared/utils/math/vector2';

export class Vehicle {
    private path: Path;
    private readonly speed;
    private travelledDistance = 0;

    constructor(path: Path, speed: number) {
        this.path = path;
        this.speed = speed;
    }

    getPath(): Path {
        return this.path;
    }

    getSpeed(): number {
        return this.speed;
    }

    getTravelledDistance(): number {
        return this.travelledDistance;
    }

    /**
     * Updates the vehicles travelled distance
     *
     * @param deltaTime Time since the last update
     */
    update(deltaTime: number): void {
        this.travelledDistance += this.speed * deltaTime;

        this.travelledDistance = Math.min(this.travelledDistance, this.path.getTotalLength());
    }

    /**
     * Returns the progress that the vehicle made in its travel along the path
     */
    getProgress(): number {
        const totalLength = this.path.getTotalLength();

        if (totalLength === 0) {
            return 1;
        }

        return this.travelledDistance / totalLength;
    }

    /**
     * Returns the vehicles position on the map
     */
    getPosition(): Vector2 {
        return this.path.getPositionAtDistance(this.travelledDistance);
    }
}
