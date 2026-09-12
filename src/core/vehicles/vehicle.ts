import type { Path } from '@core/pathfinding/path';
import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { PathLocation } from '@core/pathfinding/pathlocation';
import { Vector2 } from '@shared/utils/math/vector2';
import type { VehicleState } from './vehicle-state';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Angle } from '@shared/utils/math/angle';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import type { VehicleDetector } from './vehicle-detector';
import type { DestinationGenerator } from './destination-generator';

export class Vehicle {
    private path: Path;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;
    private readonly maxSpeed: number;
    private readonly stoppingDistance: number;
    private readonly followingDistance: number;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;
    private currentSpeed = 0;
    private travelledDistance = 0;

    constructor(
        path: Path,
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
        config: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        vehicleDetector: VehicleDetector,
    ) {
        this.path = path;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
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
     * Updates the vehicle.
     *
     * When the vehicle reaches the end of its current path,
     * it immediately generates a new destination and path.
     */
    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        let remainingTime = deltaTime;

        /*
         * A single large update can potentially take the vehicle
         * to its destination and leave some time remaining.
         *
         * Therefore we process the update in a loop so the vehicle
         * can continue on its newly generated path during the same
         * simulation step.
         */
        while (remainingTime > 0) {
            this.currentSpeed = this.getTargetSpeed();

            const distanceToTravel = (this.currentSpeed * remainingTime) / 1000;

            const totalPathLength = this.path.getTotalLength();

            const remainingDistance = totalPathLength - this.travelledDistance;

            /*
             * The vehicle has already reached the end of its path.
             */
            if (remainingDistance <= MathUtils.epsilon) {
                const consumedTime = this.changeDestination();

                if (!consumedTime) {
                    /*
                     * We could not create another route.
                     *
                     * Avoid an infinite loop and leave the
                     * vehicle at the end of its current path.
                     */
                    this.currentSpeed = 0;

                    return;
                }

                continue;
            }

            /*
             * Vehicle is currently stopped.
             *
             * No amount of remaining simulation time can advance
             * the vehicle, so we are finished with this update.
             */
            if (distanceToTravel <= 0) {
                return;
            }

            /*
             * The vehicle can complete its current path during
             * this update.
             */
            if (distanceToTravel >= remainingDistance) {
                this.travelledDistance = totalPathLength;

                /*
                 * Estimate how much simulation time was needed to
                 * travel the remaining distance at the current speed.
                 */
                const timeToDestinationMs = (remainingDistance / this.currentSpeed) * 1000;

                remainingTime = Math.max(0, remainingTime - timeToDestinationMs);

                /*
                 * Generate and switch to the next route.
                 */
                const changed = this.changeDestination();

                if (!changed) {
                    this.currentSpeed = 0;

                    return;
                }

                continue;
            }

            /*
             * Normal movement along the current path.
             */
            this.travelledDistance += distanceToTravel;

            return;
        }
    }

    /**
     * Generates a new destination from the vehicle's current
     * location and finds a new path to it.
     *
     * Returns true if a new path was created successfully.
     */
    private changeDestination(): boolean {
        const currentLocation = this.getCurrentPathLocation();

        /*
         * Generate a destination that is different from the
         * vehicle's current location.
         */
        const destination = this.destinationGenerator.generate(currentLocation);

        const newPath = this.pathfinder.findPath(currentLocation, destination);

        if (!newPath) {
            /*
             * DestinationGenerator guarantees a different location,
             * but the pathfinder can still theoretically fail.
             *
             * Try a few additional destinations before giving up.
             */
            const maxAttempts = 10;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const retryDestination = this.destinationGenerator.generate(currentLocation);

                const retryPath = this.pathfinder.findPath(currentLocation, retryDestination);

                if (retryPath) {
                    this.path = retryPath;

                    this.travelledDistance = 0;

                    this.currentSpeed = 0;

                    return true;
                }
            }

            return false;
        }

        this.path = newPath;

        this.travelledDistance = 0;

        this.currentSpeed = 0;

        return true;
    }

    /**
     * Returns the vehicle's current location on its current path.
     */
    private getCurrentPathLocation(): PathLocation {
        return this.path.getPathLocationAtDistance(this.travelledDistance);
    }

    /**
     * Returns the progress that the vehicle made in its travel along the path.
     */
    getProgress(): number {
        const totalLength = this.path.getTotalLength();

        if (totalLength === 0) {
            return 1;
        }

        return this.travelledDistance / totalLength;
    }

    /**
     * Returns the vehicle's position on the map.
     */
    getPosition(): Vector2 {
        return this.path.getPositionAtDistance(this.travelledDistance);
    }

    /**
     * Returns the vehicle's angle (rotation).
     */
    getAngle(): number {
        const distance = this.getTravelledDistance();

        const totalLength = this.path.getTotalLength();

        const currentDistance = MathUtils.clamp(
            distance,
            0,
            Math.max(0, totalLength - MathUtils.epsilon),
        );

        const currentPosition = this.path.getPositionAtDistance(currentDistance);

        const nextPosition = this.path.getPositionAtDistance(
            Math.min(currentDistance + MathUtils.epsilon, totalLength),
        );

        return Angle.fromVector(nextPosition.subtract(currentPosition));
    }

    /**
     * Returns the speed limit for the vehicle based on traffic light state.
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
