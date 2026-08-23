import type { Path } from '@core/pathfinding/path';
import { Vector2 } from '@shared/utils/math/vector2';
import type { VehicleState } from './vehicle-state';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Angle } from '@shared/utils/math/angle';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import type { VehicleDetector } from './vehicle-detector';

export class Vehicle {
    private path: Path;
    private readonly maxSpeed: number;
    private readonly stoppingDistance: number;
    private readonly followingDistance: number;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;

    private currentSpeed = 0;
    private travelledDistance = 0;

    constructor(
        path: Path,
        config: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        vehicleDetector: VehicleDetector,
    ) {
        this.path = path;
        this.maxSpeed = config.maxSpeed;
        this.stoppingDistance = config.stoppingDistance;
        this.followingDistance = config.followDistance;
        this.trafficLightSystem = trafficLightSystem;
        this.vehicleDetector = vehicleDetector;
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
        this.currentSpeed = this.getTargetSpeed();

        const distanceToTravel = (this.currentSpeed * deltaTime) / 1000;

        this.travelledDistance = Math.min(
            this.travelledDistance + distanceToTravel,
            this.path.getTotalLength(),
        );
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

    private getTargetSpeed(): number {
        let targetSpeed = this.getTrafficLightSpeedLimit();

        const vehicleAhead = this.vehicleDetector.findVehicleAhead(this);

        if (vehicleAhead !== null) {
            if (vehicleAhead.gap <= this.followingDistance) {
                targetSpeed = 0;
            } else {
                targetSpeed = Math.min(targetSpeed, vehicleAhead.vehicle.getMaxSpeed());
            }
        }

        return targetSpeed;
    }
}
