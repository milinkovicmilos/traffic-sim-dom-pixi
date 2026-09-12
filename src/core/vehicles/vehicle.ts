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

    /*
     * Maximum visual rotation speed in radians per second.
     */
    private readonly steeringSpeed = 8;

    /*
     * Small forward sample used to determine the local
     * direction of the current path segment.
     */
    private readonly steeringSampleDistance = 2;

    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;

    private currentSpeed = 0;
    private travelledDistance = 0;

    /*
     * Visual orientation is independent of the path geometry.
     */
    private currentAngle = 0;
    private angleInitialized = false;

    /*
     * When a vehicle has reached its stopping position for a
     * prohibited movement, remember that exact movement.
     *
     * The vehicle stays stopped until that movement becomes allowed.
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

        let remainingTime = deltaTime / 1000;

        /*
         * Visual steering is updated every frame.
         */
        this.updateAngle(deltaTime);

        while (remainingTime > MathUtils.epsilon) {
            /*
             * A vehicle stopped at a red light remains stopped
             * until that exact movement becomes allowed.
             */
            if (this.stoppedForMovement !== null) {
                if (!this.trafficLightSystem.allowsMovement(this.stoppedForMovement)) {
                    this.currentSpeed = 0;

                    return;
                }

                /*
                 * The light is now allowed.
                 *
                 * Clear the stop state so normal acceleration can resume.
                 */
                this.stoppedForMovement = null;
            }

            const targetSpeed = this.getTargetSpeed();

            const previousSpeed = this.currentSpeed;

            const maxSpeedChangeTime = remainingTime;

            this.currentSpeed = this.moveTowardsSpeed(
                previousSpeed,
                targetSpeed,
                maxSpeedChangeTime,
            );

            const redLightStopDistance = this.getRedLightStopDistance();

            const vehicleAhead = this.vehicleDetector.findVehicleAhead(this);

            const availableDistance = Math.max(
                0,
                this.path.getTotalLength() - this.travelledDistance,
            );

            const averageSpeed = (previousSpeed + this.currentSpeed) / 2;

            let distanceToTravel = averageSpeed * remainingTime;

            /*
             * Never cross the red-light stopping point.
             */
            if (redLightStopDistance !== null) {
                distanceToTravel = Math.min(distanceToTravel, Math.max(0, redLightStopDistance));
            }

            /*
             * Never enter the minimum safety gap.
             */
            if (vehicleAhead !== null) {
                distanceToTravel = Math.min(
                    distanceToTravel,
                    Math.max(0, vehicleAhead.gap - this.minimumGap),
                );
            }

            distanceToTravel = Math.min(distanceToTravel, availableDistance);

            /*
             * Nothing can be travelled during this frame.
             */
            if (distanceToTravel <= MathUtils.epsilon) {
                this.currentSpeed = 0;

                this.tryStopAtRedLight();

                return;
            }

            this.travelledDistance += distanceToTravel;

            /*
             * Update visual steering after movement as well.
             *
             * This is important when a frame crosses an
             * intersection boundary.
             */
            this.updateAngle(deltaTime);

            /*
             * If we reached the calculated stopping point,
             * explicitly enter the stopped-for-movement state.
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
             * Reaching the end of the current path creates
             * a new destination/path.
             */
            if (this.travelledDistance >= this.path.getTotalLength() - MathUtils.epsilon) {
                this.travelledDistance = this.path.getTotalLength();

                this.changeDestination();

                /*
                 * The remaining time should only be applied once
                 * to the new path rather than repeatedly.
                 */
                remainingTime = 0;

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
        if (!this.angleInitialized) {
            return this.getPathAngle();
        }

        return this.currentAngle;
    }

    /**
     * Smooths visual rotation toward the actual local
     * direction of the path.
     */
    private updateAngle(deltaTime: number): void {
        const targetAngle = this.getPathAngle();

        if (!this.angleInitialized) {
            this.currentAngle = targetAngle;

            this.angleInitialized = true;

            return;
        }

        const deltaSeconds = deltaTime / 1000;

        const angleDifference = this.normalizeAngle(targetAngle - this.currentAngle);

        const maxAngleChange = this.steeringSpeed * deltaSeconds;

        if (Math.abs(angleDifference) <= maxAngleChange) {
            this.currentAngle = targetAngle;

            return;
        }

        this.currentAngle = this.normalizeAngle(
            this.currentAngle + Math.sign(angleDifference) * maxAngleChange,
        );
    }

    /**
     * Gets the local tangent of the current path segment.
     */
    private getPathAngle(): number {
        const totalLength = this.path.getTotalLength();

        if (totalLength <= 0) {
            return 0;
        }

        const currentDistance = MathUtils.clamp(this.travelledDistance, 0, totalLength);

        const sampleDistance = Math.min(this.steeringSampleDistance, totalLength);

        /*
         * Prefer sampling forward.
         */
        const forwardDistance = Math.min(totalLength, currentDistance + sampleDistance);

        const currentPosition = this.path.getPositionAtDistance(currentDistance);

        const forwardPosition = this.path.getPositionAtDistance(forwardDistance);

        const forwardDirection = forwardPosition.subtract(currentPosition);

        if (forwardDirection.magnitude() > MathUtils.epsilon) {
            return Angle.fromVector(forwardDirection);
        }

        /*
         * At the end of the path there may be no forward
         * distance left, so use a short backward tangent.
         */
        const backwardDistance = Math.max(0, currentDistance - sampleDistance);

        const backwardPosition = this.path.getPositionAtDistance(backwardDistance);

        const backwardDirection = currentPosition.subtract(backwardPosition);

        if (backwardDirection.magnitude() > MathUtils.epsilon) {
            return Angle.fromVector(backwardDirection);
        }

        return this.currentAngle;
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) {
            angle -= Math.PI * 2;
        }

        while (angle < -Math.PI) {
            angle += Math.PI * 2;
        }

        return angle;
    }

    private getTargetSpeed(): number {
        if (this.stoppedForMovement !== null) {
            return 0;
        }

        let targetSpeed = this.getTrafficLightTargetSpeed();

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

    private getFollowingTargetSpeed(gap: number, vehicleAheadSpeed: number): number {
        if (gap <= this.minimumGap + MathUtils.epsilon) {
            return 0;
        }

        if (gap > this.followingDistance) {
            return this.maxSpeed;
        }

        const availableGap = gap - this.followingDistance;

        const safeSpeedSquared =
            vehicleAheadSpeed * vehicleAheadSpeed + 2 * this.braking * Math.max(0, availableGap);

        const safeSpeed = Math.sqrt(Math.max(0, safeSpeedSquared));

        return Math.min(this.maxSpeed, Math.max(vehicleAheadSpeed, safeSpeed));
    }

    /**
     * Calculates the target speed needed to approach a red light
     * smoothly and stop at the configured stopping distance.
     *
     * Calculate the maximum physically safe speed from
     * the remaining stopping distance:
     *
     *     v = sqrt(2 * a * d)
     */
    private getTrafficLightTargetSpeed(): number {
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

        /*
         * We are already at the stopping position.
         */
        if (distanceToStop <= MathUtils.epsilon) {
            return 0;
        }

        /*
         * With no braking force configured, we cannot calculate
         * a meaningful braking-limited speed.
         */
        if (this.braking <= MathUtils.epsilon) {
            return this.maxSpeed;
        }

        /*
         * Maximum speed from which we can still brake to zero
         * before the stopping point.
         */
        const brakingLimitedSpeed = Math.sqrt(2 * this.braking * distanceToStop);

        return Math.min(this.maxSpeed, Math.max(0, brakingLimitedSpeed));
    }

    /**
     * Returns the maximum distance the vehicle may travel during
     * this frame without crossing a red-light stopping point.
     */
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

        /*
         * This is the exact distance from the current vehicle
         * position to the configured stopping position.
         */
        return Math.max(0, distanceToMovement - this.stoppingDistance);
    }

    private tryStopAtRedLight(): void {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return;
        }

        /*
         * Never enter a stopped state for a movement that has
         * already become allowed.
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

        if (distanceToStop > MathUtils.epsilon) {
            return;
        }

        const movementDistance = this.path.getMovementDistance(nextMovement);

        if (movementDistance !== null) {
            this.travelledDistance = Math.max(0, movementDistance - this.stoppingDistance);
        }

        this.currentSpeed = 0;

        this.stoppedForMovement = nextMovement;
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

        this.currentAngle = this.getPathAngle();

        this.angleInitialized = true;
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
