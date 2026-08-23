import type { Path } from '@core/pathfinding/path';
import { Vector2 } from '@shared/utils/math/vector2';
import type { VehicleState } from './vehicle-state';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Angle } from '@shared/utils/math/angle';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';

export class Vehicle {
    private path: Path;
    private readonly maxSpeed: number;
    private readonly stoppingDistance: number;
    private readonly trafficLightSystem: TrafficLightSystem;

    private currentSpeed = 0;
    private travelledDistance = 0;

    constructor(path: Path, config: VehicleConfig, trafficLightSystem: TrafficLightSystem) {
        this.path = path;
        this.maxSpeed = config.maxSpeed;
        this.stoppingDistance = config.stoppingDistance;
        this.trafficLightSystem = trafficLightSystem;
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

    getCurrentSpeed(): number {
        return this.currentSpeed;
    }

    getMaxSpeed(): number {
        return this.maxSpeed;
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
        const trafficLightStopDistance = this.getTrafficLightStopDistance();

        if (trafficLightStopDistance !== null && trafficLightStopDistance <= 0) {
            this.currentSpeed = 0;
            return;
        }

        this.currentSpeed = this.maxSpeed;

        let distanceToTravel = this.getMaximumTravelDistance(deltaTime);

        if (trafficLightStopDistance !== null) {
            distanceToTravel = Math.min(distanceToTravel, trafficLightStopDistance);
        }

        this.travelledDistance += distanceToTravel;

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

    /**
     * Returns the speed limit for the vehicle based on traffic light state
     */
    private getTrafficLightSpeedLimit(): number {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return this.maxSpeed;
        }

        if (this.trafficLightSystem.allowsMovement(nextMovement)) {
            return this.maxSpeed;
        }

        const distanceToMovement = this.path.getDistanceToMovement(
            this.travelledDistance,
            nextMovement,
        );

        if (distanceToMovement === null) {
            return this.maxSpeed;
        }

        const distanceToStop = distanceToMovement - this.stoppingDistance;

        if (distanceToStop <= 0) {
            return 0;
        }

        return this.maxSpeed;
    }

    private getMaximumTravelDistance(deltaTime: number): number {
        return (this.currentSpeed * deltaTime) / 1000;
    }

    private getTrafficLightStopDistance(): number | null {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return null;
        }

        if (this.trafficLightSystem.allowsMovement(nextMovement)) {
            return null;
        }

        const distanceToMovement = this.path.getDistanceToMovement(
            this.travelledDistance,
            nextMovement,
        );

        if (distanceToMovement === null) {
            return null;
        }

        return Math.max(0, distanceToMovement - this.stoppingDistance);
    }
}
