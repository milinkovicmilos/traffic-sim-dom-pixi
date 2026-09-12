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
     * This turns collision detection from an N² scan into a lookup
     * over only the relevant lane buckets.
     */
    private readonly vehiclesByLane = new Map<Lane, Vehicle[]>();

    /*
     * Reused scratch set.
     *
     * It prevents the same candidate vehicle from being checked
     * multiple times when a path contains the same lane only once.
     */
    private readonly checkedVehicles = new Set<Vehicle>();

    addVehicles(vehicles: readonly Vehicle[]): void {
        this.vehicles = vehicles;
    }

    /**
     * Rebuilds the spatial/path index.
     *
     * This should be called once per simulation step, BEFORE
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
         * Only inspect lanes that can actually occur after the
         * current position on this vehicle's path.
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

                /*
                 * The same vehicle can appear in multiple buckets
                 * if the indexing strategy changes later. Keep this
                 * guard so we never evaluate it twice.
                 */
                if (this.checkedVehicles.has(other)) {
                    continue;
                }

                this.checkedVehicles.add(other);

                const gap = this.getGap(vehicle, vehiclePath, vehicleDistance, other);

                if (gap === null || gap <= 0) {
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
     * Returns lanes from the current lane through the end of the path.
     *
     * The current lane always comes first.
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
            return lanes;
        }

        return lanes.slice(currentIndex);
    }

    /**
     * Converts the other vehicle's current position into the
     * current vehicle's path-distance coordinate system.
     */
    private getGap(
        vehicle: Vehicle,
        vehiclePath: Path,
        vehicleDistance: number,
        other: Vehicle,
    ): number | null {
        const otherPath = other.getPath();

        const otherDistance = other.getTravelledDistance();

        const otherLocation = otherPath.getPathLocationAtDistance(otherDistance);

        const otherPathDistance = vehiclePath.getPathDistanceAtLaneDistance(
            otherLocation.getLane(),
            otherLocation.getDistance(),
        );

        if (otherPathDistance === null) {
            return null;
        }

        const centerDistance = otherPathDistance - vehicleDistance;

        return centerDistance - other.getLength();
    }
}
