import type { Vehicle } from './vehicle';

export interface VehicleAhead {
    vehicle: Vehicle;
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

            const otherPathDistance = vehiclePath.getPathDistanceAtLaneDistance(
                otherLocation.getLane(),
                otherLocation.getDistance(),
            );

            if (otherPathDistance === null) {
                continue;
            }

            const gap = otherPathDistance - vehicleDistance;

            if (gap <= 0) {
                continue;
            }

            if (closest === null || gap < closest.gap) {
                closest = {
                    vehicle: other,
                    gap,
                };
            }
        }
        console.log({
            vehicle,
            ahead: closest?.vehicle,
            gap: closest?.gap,
        });
        return closest;
    }
}
