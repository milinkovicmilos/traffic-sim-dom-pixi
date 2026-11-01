import type { Lane } from '@core/map/lane';
import type { Path } from '@core/pathfinding/path';
import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { IntersectionReservations } from '@core/traffic/intersection-reservations';
import type { Movement } from '@core/traffic/movement';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import { Vector2 } from '@shared/utils/math/vector2';
import { MathUtils } from '@shared/utils/math/math-utils';

import type { VehicleState } from './vehicle-state';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { VehicleAhead, VehicleDetector } from './vehicle-detector';
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
    private readonly width: number;
    private readonly steeringSpeed = 8;
    private readonly steeringSampleDistance = 2;
    private readonly exitBlockedPatience = 5;
    private readonly decisionDistance: number;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly intersectionReservations: IntersectionReservations;
    private readonly vehicleDetector: VehicleDetector;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;

    private currentSpeed = 0;
    private travelledDistance = 0;
    private currentAngle = 0;
    private angleInitialized = false;
    private exitBlockedTime = 0;

    // The reserved movement, held from before the stop line until the
    // vehicle is clear of the intersection. A vehicle never passes a stop line without one.
    private clearingMovement: Movement | null = null;

    // Cache the current lane index so hot-path code does not
    // repeatedly convert travelledDistance into a PathLocation.

    private currentLaneIndex = 0;

    /*
     * Cached target angle.
     *
     * Grid lanes are straight, so their direction only needs to
     * be recalculated when the vehicle enters another lane.
     */
    private targetAngle = 0;

    constructor(
        path: Path,
        config: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        intersectionReservations: IntersectionReservations,
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
        this.width = config.width;
        // From here on a vehicle could no longer stop at the line from full speed.
        this.decisionDistance = (config.maxSpeed * config.maxSpeed) / (2 * config.braking);
        this.trafficLightSystem = trafficLightSystem;
        this.intersectionReservations = intersectionReservations;
        this.vehicleDetector = vehicleDetector;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
        this.targetAngle = this.getPathAngle();
        this.currentAngle = this.targetAngle;
        this.angleInitialized = true;
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

    getWidth(): number {
        return this.width;
    }

    getTravelledDistance(): number {
        return this.travelledDistance;
    }

    getCurrentLane(): Lane {
        return this.path.getLanes()[this.currentLaneIndex];
    }

    isClearingIntersection(): boolean {
        return this.clearingMovement !== null;
    }

    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        const deltaSeconds = deltaTime / 1000;

        this.updateCurrentLane();
        this.updateAngle(deltaTime);

        const vehicleAhead = this.vehicleDetector.findVehicleAhead(this);

        this.updateClearingMovement(vehicleAhead, deltaSeconds);

        const stopLineDistance = this.getStopLineDistance();
        const targetSpeed = this.getTargetSpeed(stopLineDistance, vehicleAhead);
        const previousSpeed = this.currentSpeed;

        this.currentSpeed = this.moveTowardsSpeed(previousSpeed, targetSpeed, deltaSeconds);

        let distanceLimit = this.path.getTotalLength() - this.travelledDistance;

        if (stopLineDistance !== null) {
            distanceLimit = Math.min(distanceLimit, stopLineDistance);
        }

        if (vehicleAhead !== null) {
            distanceLimit = Math.min(distanceLimit, vehicleAhead.gap - this.minimumGap);
        }

        if (distanceLimit <= MathUtils.epsilon) {
            this.currentSpeed = 0;
            return;
        }

        const averageSpeed = (previousSpeed + this.currentSpeed) / 2;

        this.travelledDistance += Math.min(averageSpeed * deltaSeconds, distanceLimit);
        this.updateCurrentLane();
        this.updateAngle(deltaTime);

        if (this.travelledDistance >= this.path.getTotalLength() - MathUtils.epsilon) {
            this.travelledDistance = this.path.getTotalLength();
            this.changeDestination();
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
        return this.currentAngle;
    }

    private updateCurrentLane(): void {
        const laneIndex = this.path.getLaneIndexAtDistance(this.travelledDistance);

        if (laneIndex === this.currentLaneIndex) {
            return;
        }

        this.currentLaneIndex = laneIndex;

        // A lane in the grid has a fixed direction.
        // Only recalculate the steering target when the lane changes.
        this.targetAngle = this.getPathAngle();
    }

    private updateClearingMovement(vehicleAhead: VehicleAhead | null, deltaSeconds: number): void {
        if (this.clearingMovement !== null) {
            this.updateHeldReservation(this.clearingMovement);
            return;
        }

        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null || !this.canEnterIntersection(nextMovement, vehicleAhead)) {
            return;
        }

        if (!this.hasRoomToExit(nextMovement)) {
            this.waitForExitRoom(deltaSeconds);
            return;
        }

        this.exitBlockedTime = 0;

        if (this.intersectionReservations.tryReserve(nextMovement)) {
            this.clearingMovement = nextMovement;
        }
    }

    // Full lanes can wait on each other in a loop forever, so a blocked vehicle takes another route.
    private waitForExitRoom(deltaSeconds: number): void {
        this.exitBlockedTime += deltaSeconds;

        if (this.exitBlockedTime < this.exitBlockedPatience) {
            return;
        }

        this.exitBlockedTime = 0;
        this.path = this.findNewPath(this.path.getPathLocationAtDistance(this.travelledDistance));
        this.travelledDistance = 0;
        this.currentLaneIndex = 0;
    }

    private updateHeldReservation(movement: Movement): void {
        const movementDistance = this.path.getMovementDistance(movement) ?? 0;
        const hasCleared = this.travelledDistance >= movementDistance + this.stoppingDistance;

        // The light can still change while approaching the line, but not once past it.
        const stopLine = movementDistance - this.stoppingDistance;
        const lostGreen =
            this.travelledDistance <= stopLine + MathUtils.epsilon &&
            !this.trafficLightSystem.allowsMovement(movement);

        if (hasCleared || lostGreen) {
            this.releaseClearingMovement();
        }
    }

    private canEnterIntersection(movement: Movement, vehicleAhead: VehicleAhead | null): boolean {
        const stopLine = (this.path.getMovementDistance(movement) ?? 0) - this.stoppingDistance;

        if (stopLine - this.travelledDistance > this.decisionDistance) {
            return false;
        }

        // Only the first vehicle in the lane may enter, or it could block the one in front.
        const isQueued =
            vehicleAhead !== null &&
            !vehicleAhead.vehicle.isClearingIntersection() &&
            vehicleAhead.vehicle.getCurrentLane() === this.getCurrentLane();

        return !isQueued && this.trafficLightSystem.allowsMovement(movement);
    }

    // Never enter unless there is room beyond the intersection, or the vehicle could stop inside it.
    private hasRoomToExit(movement: Movement): boolean {
        const exitLane = movement.getOutgoingLane();
        const queueStart =
            this.vehicleDetector.findQueueStart(exitLane) ??
            exitLane.getLength() - this.stoppingDistance;
        const vehiclesToFit = this.intersectionReservations.countEntering(exitLane) + 1;

        return (
            queueStart - vehiclesToFit * (this.length + this.minimumGap) >= this.stoppingDistance
        );
    }

    private releaseClearingMovement(): void {
        if (this.clearingMovement !== null) {
            this.intersectionReservations.release(this.clearingMovement);
            this.clearingMovement = null;
        }
    }

    private updateAngle(deltaTime: number): void {
        if (!this.angleInitialized) {
            this.currentAngle = this.targetAngle;
            this.angleInitialized = true;
            return;
        }

        const deltaSeconds = deltaTime / 1000;
        const angleDifference = this.normalizeAngle(this.targetAngle - this.currentAngle);
        const maxAngleChange = this.steeringSpeed * deltaSeconds;

        if (Math.abs(angleDifference) <= maxAngleChange) {
            this.currentAngle = this.targetAngle;
            return;
        }

        this.currentAngle = this.normalizeAngle(
            this.currentAngle + Math.sign(angleDifference) * maxAngleChange,
        );
    }

    private getPathAngle(): number {
        const totalLength = this.path.getTotalLength();

        if (totalLength <= 0) {
            return 0;
        }

        // Prefer the current lane's cached direction.
        // We only fall back to geometric sampling because that also handles the beginning/end of paths robustly.
        const lanes = this.path.getLanes();

        if (this.currentLaneIndex >= 0 && this.currentLaneIndex < lanes.length) {
            const lane = lanes[this.currentLaneIndex];
            const start = lane.getStartPosition();
            const end = lane.getEndPosition();
            const dx = end.x - start.x;
            const dy = end.y - start.y;

            if (Math.abs(dx) > MathUtils.epsilon || Math.abs(dy) > MathUtils.epsilon) {
                return Math.atan2(dy, dx);
            }
        }

        const currentDistance = MathUtils.clamp(this.travelledDistance, 0, totalLength);
        const sampleDistance = Math.min(this.steeringSampleDistance, totalLength);
        const forwardDistance = Math.min(totalLength, currentDistance + sampleDistance);
        const currentPosition = this.path.getPositionAtDistance(currentDistance);
        const forwardPosition = this.path.getPositionAtDistance(forwardDistance);
        const dx = forwardPosition.x - currentPosition.x;
        const dy = forwardPosition.y - currentPosition.y;

        if (dx * dx + dy * dy > MathUtils.epsilon * MathUtils.epsilon) {
            return Math.atan2(dy, dx);
        }

        const backwardDistance = Math.max(0, currentDistance - sampleDistance);
        const backwardPosition = this.path.getPositionAtDistance(backwardDistance);
        const backwardDx = currentPosition.x - backwardPosition.x;
        const backwardDy = currentPosition.y - backwardPosition.y;

        if (
            backwardDx * backwardDx + backwardDy * backwardDy >
            MathUtils.epsilon * MathUtils.epsilon
        ) {
            return Math.atan2(backwardDy, backwardDx);
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

    private getTargetSpeed(
        stopLineDistance: number | null,
        vehicleAhead: VehicleAhead | null,
    ): number {
        let targetSpeed = this.maxSpeed;

        if (stopLineDistance !== null) {
            // Maximum speed that still allows stopping at the line.
            targetSpeed = Math.sqrt(2 * this.braking * Math.max(0, stopLineDistance));
        }

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

    // Distance to the next stop line this vehicle has no reservation for.
    private getStopLineDistance(): number | null {
        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null || nextMovement === this.clearingMovement) {
            return null;
        }

        const distanceToMovement = this.path.getDistanceToMovement(
            this.travelledDistance,
            nextMovement,
        );

        return distanceToMovement === null ? null : distanceToMovement - this.stoppingDistance;
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

        this.releaseClearingMovement();
        this.path = newPath;
        this.travelledDistance = 0;
        this.currentSpeed = 0;
        this.currentLaneIndex = 0;
        this.targetAngle = this.getPathAngle();
        this.currentAngle = this.targetAngle;
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
