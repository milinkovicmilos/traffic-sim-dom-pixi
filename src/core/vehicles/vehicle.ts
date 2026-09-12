import type { Path } from '@core/pathfinding/path';
import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { Movement } from '@core/traffic/movement';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';

import { Vector2 } from '@shared/utils/math/vector2';
import { MathUtils } from '@shared/utils/math/math-utils';
import { Angle } from '@shared/utils/math/angle';

import type { VehicleState } from './vehicle-state';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { VehicleDetector } from './vehicle-detector';
import type { DestinationGenerator } from './destination-generator';

export class Vehicle {
    private path: Path;

    private readonly acceleration: number;
    private readonly braking: number;
    private readonly maxSpeed: number;
    private readonly stoppingDistance: number;
    private readonly followingDistance: number;
    private readonly minimumGap: number;
    private readonly length: number;

    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;

    private currentSpeed = 0;
    private travelledDistance = 0;

    /**
     * The exact movement that caused this vehicle to stop.
     *
     * The vehicle remains stopped until this same movement
     * becomes allowed.
     */
    private stoppedForMovement: Movement | null = null;

    constructor(
        path: Path,
        config: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        vehicleDetector: VehicleDetector,
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
    ) {
        this.path = path;
        this.acceleration = config.acceleration;
        this.braking = config.braking;
        this.maxSpeed = config.maxSpeed;
        this.stoppingDistance = config.stoppingDistance;
        this.followingDistance = config.followDistance;
        this.minimumGap = config.minimumGap;
        this.length = config.length;
        this.trafficLightSystem = trafficLightSystem;
        this.vehicleDetector = vehicleDetector;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
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

    getLength(): number {
        return this.length;
    }

    getTravelledDistance(): number {
        return this.travelledDistance;
    }

    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        const remainingTime = deltaTime / 1000;

        while (remainingTime > MathUtils.epsilon) {
            /*
             * A vehicle stopped by a red light cannot move
             * until that exact movement becomes allowed.
             */
            if (this.stoppedForMovement !== null) {
                if (!this.trafficLightSystem.allowsMovement(this.stoppedForMovement)) {
                    this.currentSpeed = 0;
                    return;
                }

                this.stoppedForMovement = null;
            }

            const targetSpeed = this.getTargetSpeed();

            const previousSpeed = this.currentSpeed;

            this.currentSpeed = this.moveTowardsSpeed(previousSpeed, targetSpeed, remainingTime);

            const redLightStopDistance = this.getRedLightStopDistance();

            const vehicleAhead = this.vehicleDetector.findVehicleAhead(this);

            const availableDistance = Math.max(
                0,
                this.path.getTotalLength() - this.travelledDistance,
            );

            const averageSpeed = (previousSpeed + this.currentSpeed) / 2;

            let distanceToTravel = averageSpeed * remainingTime;

            /*
             * Red-light safety clamp.
             */
            if (redLightStopDistance !== null) {
                distanceToTravel = Math.min(distanceToTravel, Math.max(0, redLightStopDistance));
            }

            /*
             * Vehicle-following safety clamp.
             *
             * Never allow the vehicle to travel farther than
             * the amount of road available before the desired
             * following distance.
             *
             * This is the final collision-prevention guard for
             * each simulation step.
             */
            if (vehicleAhead !== null) {
                /*
                 * The hard safety limit is independent from the
                 * preferred following distance.
                 */
                const safeFollowDistance = Math.max(this.minimumGap, 0);

                distanceToTravel = Math.min(
                    distanceToTravel,
                    Math.max(0, vehicleAhead.gap - safeFollowDistance),
                );
            }

            distanceToTravel = Math.min(distanceToTravel, availableDistance);

            /*
             * No movement is possible during this step.
             */
            if (distanceToTravel <= MathUtils.epsilon) {
                this.currentSpeed = 0;

                this.tryStopAtRedLight();

                return;
            }

            this.travelledDistance += distanceToTravel;

            /*
             * Check whether the red-light stopping point
             * has just been reached.
             */
            if (
                redLightStopDistance !== null &&
                redLightStopDistance - distanceToTravel <= MathUtils.epsilon
            ) {
                this.tryStopAtRedLight();

                if (this.stoppedForMovement !== null) {
                    return;
                }
            }

            /*
             * Reached the end of the path.
             */
            if (this.travelledDistance >= this.path.getTotalLength() - MathUtils.epsilon) {
                this.travelledDistance = this.path.getTotalLength();

                this.changeDestination();

                /*
                 * Continue on the newly generated path
                 * using any remaining frame time.
                 */
                continue;
            }

            return;
        }
    }

    getProgress(): number {
        const totalLength = this.path.getTotalLength();

        if (totalLength <= 0) {
            return 1;
        }

        return this.travelledDistance / totalLength;
    }

    getPosition(): Vector2 {
        return this.path.getPositionAtDistance(this.travelledDistance);
    }

    getAngle(): number {
        const distance = this.travelledDistance;

        const totalLength = this.path.getTotalLength();

        if (totalLength <= 0) {
            return 0;
        }

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

    private getTargetSpeed(): number {
        /*
         * Red-light stop has absolute priority.
         */
        if (this.stoppedForMovement !== null) {
            return 0;
        }

        let targetSpeed = this.getTrafficLightTargetSpeed();

        /*
         * Apply collision-avoidance speed.
         */
        const vehicleAhead = this.vehicleDetector.findVehicleAhead(this);

        if (vehicleAhead !== null) {
            targetSpeed = Math.min(
                targetSpeed,
                this.getFollowingTargetSpeed(
                    vehicleAhead.gap,
                    vehicleAhead.vehicle.getCurrentSpeed(),
                ),
            );
        }

        return MathUtils.clamp(targetSpeed, 0, this.maxSpeed);
    }

    /**
     * Calculates a safe speed from the current gap
     * and the speed of the vehicle ahead.
     *
     * The calculation assumes we can brake at our configured
     * braking rate and attempts to preserve followingDistance.
     */
    private getFollowingTargetSpeed(gap: number, vehicleAheadSpeed: number): number {
        if (gap <= this.minimumGap + MathUtils.epsilon) {
            return 0;
        }

        /*
         * We only start actively matching the vehicle ahead
         * when we enter the preferred following distance.
         */
        if (gap > this.followingDistance) {
            return this.maxSpeed;
        }

        /*
         * Distance available before reaching the preferred gap.
         */
        const availableGap = gap - this.followingDistance;

        /*
         * At or inside the preferred gap, calculate a speed
         * that allows us to settle behind the vehicle ahead.
         */
        const safeSpeedSquared =
            vehicleAheadSpeed * vehicleAheadSpeed + 2 * this.braking * Math.max(0, availableGap);

        const safeSpeed = Math.sqrt(Math.max(0, safeSpeedSquared));

        return Math.min(this.maxSpeed, Math.max(vehicleAheadSpeed, safeSpeed));
    }

    private getTrafficLightTargetSpeed(): number {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return this.maxSpeed;
        }

        /*
         * The movement is allowed.
         */
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

        /*
         * We are already at the stopping position.
         */
        if (distanceToStop <= 0) {
            return 0;
        }

        const brakingDistance = this.getBrakingDistance(this.currentSpeed);

        /*
         * Start braking as soon as the current speed
         * requires braking to reach the stop point.
         */
        if (distanceToStop <= brakingDistance) {
            return 0;
        }

        return this.maxSpeed;
    }

    private getRedLightStopDistance(): number | null {
        if (this.stoppedForMovement !== null) {
            return 0;
        }

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

        const distanceToStop = distanceToMovement - this.stoppingDistance;

        if (distanceToStop <= MathUtils.epsilon) {
            return 0;
        }

        const brakingDistance = this.getBrakingDistance(this.currentSpeed);

        /*
         * Once we are inside the braking zone, clamp the
         * actual movement so a large frame cannot carry us
         * through the stop point.
         */
        if (brakingDistance >= distanceToStop) {
            return distanceToStop;
        }

        return null;
    }

    private tryStopAtRedLight(): void {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return;
        }

        /*
         * The light changed before we stopped.
         */
        if (this.trafficLightSystem.allowsMovement(nextMovement)) {
            return;
        }

        const distanceToMovement = this.path.getDistanceToMovement(
            this.travelledDistance,
            nextMovement,
        );

        if (distanceToMovement === null) {
            return;
        }

        const distanceToStop = distanceToMovement - this.stoppingDistance;

        if (distanceToStop <= MathUtils.epsilon) {
            const movementDistance = this.path.getMovementDistance(nextMovement);

            if (movementDistance !== null) {
                this.travelledDistance = Math.max(0, movementDistance - this.stoppingDistance);
            }

            this.currentSpeed = 0;

            this.stoppedForMovement = nextMovement;
        }
    }

    private getBrakingDistance(speed: number): number {
        if (speed <= MathUtils.epsilon) {
            return 0;
        }

        if (this.braking <= MathUtils.epsilon) {
            return Number.POSITIVE_INFINITY;
        }

        return (speed * speed) / (2 * this.braking);
    }

    private moveTowardsSpeed(
        currentSpeed: number,
        targetSpeed: number,
        deltaSeconds: number,
    ): number {
        if (deltaSeconds <= 0) {
            return currentSpeed;
        }

        if (targetSpeed > currentSpeed) {
            return Math.min(targetSpeed, currentSpeed + this.acceleration * deltaSeconds);
        }

        if (targetSpeed < currentSpeed) {
            return Math.max(targetSpeed, currentSpeed - this.braking * deltaSeconds);
        }

        return currentSpeed;
    }

    private changeDestination(): void {
        const start = this.path.getEndLocation();

        const newPath = this.findNewPath(start);

        this.path = newPath;

        this.travelledDistance = 0;

        this.currentSpeed = 0;

        this.stoppedForMovement = null;
    }

    private findNewPath(start: PathLocation): Path {
        for (let attempt = 0; attempt < 100; attempt++) {
            const destination = this.destinationGenerator.generate(start);

            const path = this.pathfinder.findPath(start, destination);

            if (path !== null) {
                return path;
            }
        }

        throw new Error('Failed to find a new path after reaching vehicle destination.');
    }
}
