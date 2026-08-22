import type { Path } from '@core/pathfinding/path';
import { Vector2 } from '@shared/utils/math/vector2';
import type { VehicleState } from './vehicle-state';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Angle } from '@shared/utils/math/angle';

export class Vehicle {
    private path: Path;
    private readonly speed;
    private travelledDistance = 0;

    constructor(path: Path, speed: number) {
        this.path = path;
        this.speed = speed;
    }

    getState(): VehicleState {
        return {
            position: this.getPosition(),
            angle: this.getAngle(),
        };
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
        // Since the speed is defined as units/second, we need to convert the deltaTime to seconds
        this.travelledDistance += (this.speed * deltaTime) / 1000;

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

    /**
     * Returns the vehicles angle (rotation)
     */
    getAngle(): number {
        const distance = this.getTravelledDistance();
        const totalLength = this.path.getTotalLength();

        const currentDistance = MathUtils.clamp(distance, 0, totalLength - MathUtils.epsilon);

        const currentPosition = this.path.getPositionAtDistance(currentDistance);

        const nextPosition = this.path.getPositionAtDistance(
            Math.min(currentDistance + MathUtils.epsilon, totalLength),
        );

        return Angle.fromVector(nextPosition.subtract(currentPosition));
    }
}
