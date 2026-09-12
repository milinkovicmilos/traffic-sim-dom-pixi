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

    addVehicles(vehicles: readonly Vehicle[]): void {
        this.vehicles = vehicles;
    }

    findVehicleAhead(vehicle: Vehicle): VehicleAhead | null {
        const vehiclePath = vehicle.getPath();

        const vehicleDistance = vehicle.getTravelledDistance();

        let closest: VehicleAhead | null = null;

        for (const other of this.vehicles) {
            if (other === vehicle) {
                continue;
            }

            const otherPath = other.getPath();

            const otherDistance = other.getTravelledDistance();

            const otherLocation = otherPath.getPathLocationAtDistance(otherDistance);

            /*
             * Project the other vehicle's location onto
             * this vehicle's path.
             *
             * If the paths do not share this lane sequence,
             * they are not considered a following conflict.
             */
            const otherPathDistance = vehiclePath.getPathDistanceAtLaneDistance(
                otherLocation.getLane(),
                otherLocation.getDistance(),
            );

            if (otherPathDistance === null) {
                continue;
            }

            /*
             * Convert center-to-center distance to
             * bumper-to-bumper distance by subtracting
             * the length of the vehicle ahead.
             */
            const centerDistance = otherPathDistance - vehicleDistance;

            const gap = centerDistance - other.getLength();

            /*
             * A vehicle at or behind us is not ahead.
             */
            if (gap <= 0) {
                continue;
            }

            /*
             * Only keep the nearest vehicle ahead.
             */
            if (closest === null || gap < closest.gap) {
                closest = {
                    vehicle: other,
                    gap,
                };
            }
        }

        return closest;
    }
}
