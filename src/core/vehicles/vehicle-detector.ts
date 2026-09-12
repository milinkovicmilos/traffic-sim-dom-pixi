import type { Lane } from '@core/map/lane';
import type { Path } from '@core/pathfinding/path';
import type { Vehicle } from './vehicle';

export interface VehicleAhead {
    vehicle: Vehicle;

    /**
     * Bumper-to-bumper distance along the current vehicle's path.
     */
    gap: number;
}

export class VehicleDetector {
    private vehicles: readonly Vehicle[] = [];

    /*
     * Vehicles are indexed by the lane they currently occupy.
     *
     * This index is rebuilt once per simulation step, before any
     * vehicles are updated.
     */
    private readonly vehiclesByLane = new Map<Lane, Vehicle[]>();

    /*
     * Scratch set reused during detection.
     */
    private readonly checkedVehicles = new Set<Vehicle>();

    /*
     * Never let vehicle following look arbitrarily far ahead.
     *
     * This prevents a vehicle on a later section of the route
     * from becoming a blocker while it is still far away.
     */
    private readonly maximumLookAheadDistance = 100;

    addVehicles(vehicles: readonly Vehicle[]): void {
        this.vehicles = vehicles;
    }

    /**
     * Rebuilds the lane index.
     *
     * This should be called once per simulation step BEFORE
     * vehicles are updated.
     */
    rebuild(): void {
        this.vehiclesByLane.clear();

        for (const vehicle of this.vehicles) {
            const path = vehicle.getPath();

            const location = path.getPathLocationAtDistance(vehicle.getTravelledDistance());

            const lane = location.getLane();

            let bucket = this.vehiclesByLane.get(lane);

            if (!bucket) {
                bucket = [];

                this.vehiclesByLane.set(lane, bucket);
            }

            bucket.push(vehicle);
        }
    }

    findVehicleAhead(vehicle: Vehicle): VehicleAhead | null {
        const vehiclePath = vehicle.getPath();

        const vehicleDistance = vehicle.getTravelledDistance();

        this.checkedVehicles.clear();

        let closest: VehicleAhead | null = null;

        /*
         * Only inspect:
         *
         *   1. the current lane
         *   2. the immediately following lane
         *
         * and only within the configured maximum look-ahead
         * distance.
         */
        const relevantLanes = this.getRelevantLanes(vehiclePath, vehicleDistance);

        for (const lane of relevantLanes) {
            const candidates = this.vehiclesByLane.get(lane);

            if (!candidates || candidates.length === 0) {
                continue;
            }

            for (const other of candidates) {
                if (other === vehicle) {
                    continue;
                }

                if (this.checkedVehicles.has(other)) {
                    continue;
                }

                this.checkedVehicles.add(other);

                const gap = this.getGap(vehiclePath, vehicleDistance, other);

                if (gap === null || gap <= 0) {
                    continue;
                }

                /*
                 * Never allow distant vehicles to affect this
                 * vehicle's immediate driving decision.
                 */
                if (gap > this.maximumLookAheadDistance) {
                    continue;
                }

                if (closest === null || gap < closest.gap) {
                    closest = {
                        vehicle: other,
                        gap,
                    };
                }
            }
        }

        return closest;
    }

    /**
     * Returns the current lane plus at most one lane after it.
     */
    private getRelevantLanes(path: Path, travelledDistance: number): readonly Lane[] {
        const lanes = path.getLanes();

        if (lanes.length === 0) {
            return [];
        }

        const location = path.getPathLocationAtDistance(travelledDistance);

        const currentLane = location.getLane();

        const currentIndex = lanes.indexOf(currentLane);

        if (currentIndex === -1) {
            return [];
        }

        const endIndex = Math.min(lanes.length, currentIndex + 2);

        return lanes.slice(currentIndex, endIndex);
    }

    /**
     * Converts the other vehicle's current position into the
     * current vehicle's path-distance coordinate system.
     */
    private getGap(vehiclePath: Path, vehicleDistance: number, other: Vehicle): number | null {
        const otherPath = other.getPath();

        const otherDistance = other.getTravelledDistance();

        const otherLocation = otherPath.getPathLocationAtDistance(otherDistance);

        const otherLane = otherLocation.getLane();

        /*
         * The other vehicle must actually be on a lane that is
         * immediately relevant to this vehicle's path.
         */
        const relevantLanes = this.getRelevantLanes(vehiclePath, vehicleDistance);

        if (!relevantLanes.includes(otherLane)) {
            return null;
        }

        const otherPathDistance = vehiclePath.getPathDistanceAtLaneDistance(
            otherLane,
            otherLocation.getDistance(),
        );

        if (otherPathDistance === null) {
            return null;
        }

        const centerDistance = otherPathDistance - vehicleDistance;

        /*
         * A vehicle behind us is not a blocker.
         */
        if (centerDistance <= 0) {
            return null;
        }

        /*
         * Convert center-to-center distance into a bumper gap.
         */
        return centerDistance - other.getLength();
    }
}
