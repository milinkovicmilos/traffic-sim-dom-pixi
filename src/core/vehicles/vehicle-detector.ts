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
     * The index is rebuilt once per simulation step from the
     * beginning-of-step vehicle state.
     */
    private readonly vehiclesByLane = new Map<Lane, Vehicle[]>();

    /*
     * Reused scratch set to avoid checking the same vehicle more
     * than once when it is relevant through multiple lanes.
     */
    private readonly checkedVehicles = new Set<Vehicle>();

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
         * Only consider vehicles on:
         *
         * 1. the lane the vehicle currently occupies
         * 2. the immediately following lane on its path
         *
         * We deliberately do NOT search every future lane in the path.
         *
         * Searching the entire route can cause vehicles near an
         * intersection to wait for vehicles much farther down the
         * route, which can create artificial gridlock.
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

                const gap = this.getGap(vehicle, vehiclePath, vehicleDistance, other);

                if (gap === null || gap <= 0) {
                    continue;
                }

                /*
                 * We only care about the closest vehicle ahead.
                 */
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
     * Returns only the current lane and the immediate next lane.
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
            return [];
        }

        /*
         * Include the current lane and at most one lane after it.
         *
         * This is enough to prevent vehicles from driving into
         * another vehicle immediately ahead while avoiding
         * long-range path-based dependencies that can deadlock
         * multiple intersections.
         */
        const endIndex = Math.min(lanes.length, currentIndex + 2);

        return lanes.slice(currentIndex, endIndex);
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

        const otherLane = otherLocation.getLane();

        /*
         * Ignore vehicles that are not actually on one of the
         * lanes relevant to this vehicle's immediate route.
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
         * Convert center-to-center distance into a bumper-to-
         * bumper distance by subtracting the vehicle ahead's
         * physical length.
         */
        return centerDistance - other.getLength();
    }
}
