import type { Path } from '@core/pathfinding/path';
import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { PathLocation } from '@core/pathfinding/pathlocation';
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

    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;

    private currentSpeed = 0;
    private travelledDistance = 0;

    private currentAngle = 0;
    private angleInitialized = false;

    private stoppedForMovement: Movement | null = null;

    /*
     * Once a vehicle has committed to crossing a movement,
     * ordinary following/traffic-light logic must not stop it
     * in the middle of the intersection.
     */
    private clearingMovement: Movement | null = null;

    /*
     * Cache the current lane index so hot-path code does not
     * repeatedly convert travelledDistance into a PathLocation.
     */
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

        this.trafficLightSystem = trafficLightSystem;

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

    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        let remainingTime = deltaTime / 1000;

        this.updateCurrentLane();

        this.updateAngle(deltaTime);

        while (remainingTime > MathUtils.epsilon) {
            /*
             * A vehicle stopped at a prohibited movement remains
             * stopped until that exact movement becomes allowed.
             */
            if (this.stoppedForMovement !== null) {
                if (!this.trafficLightSystem.allowsMovement(this.stoppedForMovement)) {
                    this.currentSpeed = 0;

                    return;
                }

                this.stoppedForMovement = null;
            }

            this.updateCurrentLane();

            this.updateClearingMovement();

            /*
             * Query the detector once for this update.
             *
             * The result is reused for target-speed calculation
             * and actual distance limiting.
             */
            const vehicleAhead =
                this.clearingMovement === null ? this.vehicleDetector.findVehicleAhead(this) : null;

            const nextMovement = this.path.getNextMovement(this.travelledDistance);

            const targetSpeed = this.getTargetSpeed(nextMovement, vehicleAhead);

            const previousSpeed = this.currentSpeed;

            this.currentSpeed = this.moveTowardsSpeed(previousSpeed, targetSpeed, remainingTime);

            const redLightStopDistance = this.getRedLightStopDistance(nextMovement);

            const availableDistance = Math.max(
                0,
                this.path.getTotalLength() - this.travelledDistance,
            );

            const averageSpeed = (previousSpeed + this.currentSpeed) / 2;

            let distanceToTravel = averageSpeed * remainingTime;

            /*
             * Never cross a red-light stopping point.
             */
            if (redLightStopDistance !== null) {
                distanceToTravel = Math.min(distanceToTravel, Math.max(0, redLightStopDistance));
            }

            /*
             * Maintain the following gap only while approaching
             * an intersection, not while committed to clearing it.
             */
            if (vehicleAhead !== null) {
                distanceToTravel = Math.min(
                    distanceToTravel,
                    Math.max(0, vehicleAhead.gap - this.minimumGap),
                );
            }

            distanceToTravel = Math.min(distanceToTravel, availableDistance);

            if (distanceToTravel <= MathUtils.epsilon) {
                this.currentSpeed = 0;

                this.tryStopAtRedLight(nextMovement);

                return;
            }

            this.travelledDistance += distanceToTravel;

            this.updateCurrentLane();

            this.updateAngle(deltaTime);

            /*
             * We reached a red-light stopping position.
             */
            if (
                redLightStopDistance !== null &&
                redLightStopDistance - distanceToTravel <= MathUtils.epsilon
            ) {
                this.tryStopAtRedLight(nextMovement);

                if (this.stoppedForMovement !== null) {
                    return;
                }
            }

            /*
             * Reached destination.
             */
            if (this.travelledDistance >= this.path.getTotalLength() - MathUtils.epsilon) {
                this.travelledDistance = this.path.getTotalLength();

                this.changeDestination();

                remainingTime = 0;

                continue;
            }

            this.updateClearingMovement();

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
        return this.currentAngle;
    }

    private updateCurrentLane(): void {
        const laneIndex = this.path.getLaneIndexAtDistance(this.travelledDistance);

        if (laneIndex === this.currentLaneIndex) {
            return;
        }

        this.currentLaneIndex = laneIndex;

        /*
         * A lane in the grid has a fixed direction.
         * Only recalculate the steering target when the lane
         * changes.
         */
        this.targetAngle = this.getPathAngle();
    }

    private updateClearingMovement(): void {
        if (this.clearingMovement !== null) {
            const nextMovement = this.path.getNextMovement(this.travelledDistance);

            /*
             * Once the vehicle is no longer approaching the
             * movement it committed to, the intersection has
             * been cleared.
             */
            if (nextMovement === null || !this.clearingMovement.isEquivalentTo(nextMovement)) {
                this.clearingMovement = null;
            }

            return;
        }

        const nextMovement = this.path.getNextMovement(this.travelledDistance);

        if (nextMovement === null) {
            return;
        }

        const movementDistance = this.path.getMovementDistance(nextMovement);

        if (movementDistance === null) {
            return;
        }

        /*
         * Once we reach the practical stop-line position,
         * commit to crossing the movement.
         */
        const commitDistance = movementDistance - this.stoppingDistance;

        if (this.travelledDistance >= commitDistance - MathUtils.epsilon) {
            this.clearingMovement = nextMovement;
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

        /*
         * Prefer the current lane's cached direction.
         *
         * We only fall back to geometric sampling because that
         * also handles the beginning/end of paths robustly.
         */
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
        nextMovement: Movement | null,
        vehicleAhead: VehicleAhead | null,
    ): number {
        if (this.stoppedForMovement !== null) {
            return 0;
        }

        let targetSpeed = this.getTrafficLightTargetSpeed(nextMovement);

        /*
         * Do not allow ordinary following logic to stop a vehicle
         * once it has committed to clearing an intersection.
         */
        if (vehicleAhead !== null && this.clearingMovement === null) {
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

    private getTrafficLightTargetSpeed(nextMovement: Movement | null): number {
        /*
         * Already committed to this movement.
         */
        if (this.clearingMovement !== null) {
            return this.maxSpeed;
        }

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

        if (distanceToStop <= MathUtils.epsilon) {
            return 0;
        }

        if (this.braking <= MathUtils.epsilon) {
            return this.maxSpeed;
        }

        /*
         * Maximum speed that still allows stopping before the
         * stop line.
         */
        const safeSpeed = Math.sqrt(2 * this.braking * distanceToStop);

        return Math.min(this.maxSpeed, Math.max(0, safeSpeed));
    }

    private getRedLightStopDistance(nextMovement: Movement | null): number | null {
        if (this.stoppedForMovement !== null) {
            return 0;
        }

        /*
         * Do not stop again after committing to the movement.
         */
        if (this.clearingMovement !== null) {
            return null;
        }

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

    private tryStopAtRedLight(nextMovement: Movement | null): void {
        if (this.clearingMovement !== null) {
            return;
        }

        if (nextMovement === null) {
            return;
        }

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

        this.path = newPath;

        this.travelledDistance = 0;

        this.currentSpeed = 0;

        this.stoppedForMovement = null;

        this.clearingMovement = null;

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
