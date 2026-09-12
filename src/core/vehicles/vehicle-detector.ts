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

interface LaneVehicleEntry {
    vehicle: Vehicle;
    laneDistance: number;
}

export class VehicleDetector {
    private vehicles: readonly Vehicle[] = [];

    private readonly vehiclesByLane = new Map<Lane, LaneVehicleEntry[]>();

    /*
     * Only vehicles reasonably close to the current vehicle
     * need to be inspected.
     */
    private readonly maximumLookAheadDistance = 100;

    /*
     * Reused result scratch value.
     *
     * There is no Set allocation/clearing on every vehicle query.
     */
    addVehicles(vehicles: readonly Vehicle[]): void {
        this.vehicles = vehicles;
    }

    /**
     * Rebuild the lane index.
     *
     * This should be called once per simulation step BEFORE
     * vehicles are updated.
     */
    rebuild(): void {
        this.vehiclesByLane.clear();

        for (let i = 0; i < this.vehicles.length; i++) {
            const vehicle = this.vehicles[i];

            const path = vehicle.getPath();

            const travelledDistance = vehicle.getTravelledDistance();

            const location = path.getPathLocationAtDistance(travelledDistance);

            const lane = location.getLane();

            let bucket = this.vehiclesByLane.get(lane);

            if (!bucket) {
                bucket = [];

                this.vehiclesByLane.set(lane, bucket);
            }

            bucket.push({
                vehicle,
                laneDistance: location.getDistance(),
            });
        }

        /*
         * Sort each lane by physical lane position.
         *
         * Vehicles on the same lane can then be searched from
         * closest to farthest rather than scanning arbitrary order.
         */
        for (const bucket of this.vehiclesByLane.values()) {
            bucket.sort((a, b) => a.laneDistance - b.laneDistance);
        }
    }

    findVehicleAhead(vehicle: Vehicle): VehicleAhead | null {
        const vehiclePath = vehicle.getPath();

        const vehicleDistance = vehicle.getTravelledDistance();

        const relevantLanes = this.getRelevantLanes(vehiclePath, vehicleDistance);

        let closest: VehicleAhead | null = null;

        for (let laneIndex = 0; laneIndex < relevantLanes.length; laneIndex++) {
            const lane = relevantLanes[laneIndex];

            const bucket = this.vehiclesByLane.get(lane);

            if (!bucket || bucket.length === 0) {
                continue;
            }

            const currentVehicleLocation = vehiclePath.getPathLocationAtDistance(vehicleDistance);

            /*
             * For the current lane we can compare lane-local
             * distances directly.
             *
             * For the next lane we still use path conversion
             * because the vehicle hasn't reached that lane yet.
             */
            const currentLane = currentVehicleLocation.getLane();

            const currentLaneDistance = currentVehicleLocation.getDistance();

            if (lane === currentLane) {
                const currentIndex = this.findFirstAhead(bucket, currentLaneDistance);

                for (let i = currentIndex; i < bucket.length; i++) {
                    const entry = bucket[i];

                    if (entry.vehicle === vehicle) {
                        continue;
                    }

                    const centerDistance = entry.laneDistance - currentLaneDistance;

                    if (centerDistance <= 0) {
                        continue;
                    }

                    const gap = centerDistance - entry.vehicle.getLength();

                    if (gap <= 0 || gap > this.maximumLookAheadDistance) {
                        break;
                    }

                    if (closest === null || gap < closest.gap) {
                        closest = {
                            vehicle: entry.vehicle,
                            gap,
                        };
                    }

                    /*
                     * Because this lane bucket is sorted,
                     * this is the closest candidate on it.
                     */
                    break;
                }

                continue;
            }

            /*
             * Next-lane candidate.
             *
             * Only inspect candidates that are close enough to
             * matter before the current vehicle reaches them.
             */
            for (let i = 0; i < bucket.length; i++) {
                const entry = bucket[i];

                if (entry.vehicle === vehicle) {
                    continue;
                }

                const otherPathDistance = vehiclePath.getPathDistanceAtLaneDistance(
                    lane,
                    entry.laneDistance,
                );

                if (otherPathDistance === null) {
                    continue;
                }

                const centerDistance = otherPathDistance - vehicleDistance;

                if (centerDistance <= 0) {
                    continue;
                }

                if (centerDistance > this.maximumLookAheadDistance) {
                    /*
                     * This bucket is ordered by lane distance,
                     * so subsequent vehicles cannot be closer.
                     */
                    break;
                }

                const gap = centerDistance - entry.vehicle.getLength();

                if (gap <= 0) {
                    continue;
                }

                if (closest === null || gap < closest.gap) {
                    closest = {
                        vehicle: entry.vehicle,
                        gap,
                    };
                }

                /*
                 * Bucket is ordered, therefore the first
                 * relevant vehicle is the closest one.
                 */
                break;
            }
        }

        return closest;
    }

    private getRelevantLanes(path: Path, travelledDistance: number): readonly Lane[] {
        const lanes = path.getLanes();

        if (lanes.length === 0) {
            return [];
        }

        const currentLaneIndex = path.getLaneIndexAtDistance(travelledDistance);

        /*
         * Current lane + next lane.
         *
         * Avoid looking farther through the route because that
         * creates unnecessary dependencies and can produce
         * artificial traffic gridlock.
         */
        return lanes.slice(currentLaneIndex, Math.min(lanes.length, currentLaneIndex + 2));
    }

    private findFirstAhead(bucket: readonly LaneVehicleEntry[], laneDistance: number): number {
        let low = 0;
        let high = bucket.length;

        /*
         * Binary search for the first vehicle strictly ahead.
         */
        while (low < high) {
            const mid = Math.floor((low + high) / 2);

            if (bucket[mid].laneDistance <= laneDistance) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }
}
