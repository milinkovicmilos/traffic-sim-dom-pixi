import type { Vehicle } from '@core/vehicles/vehicle';
import type { VehicleSpawner } from '@core/vehicles/vehicle-spawner';
import type { VehicleState } from '@core/vehicles/vehicle-state';

export class Simulation {
    private readonly vehicles: Vehicle[] = [];
    private readonly vehicleSpawner: VehicleSpawner;

    constructor(vehicleSpawner: VehicleSpawner) {
        this.vehicleSpawner = vehicleSpawner;
    }

    /**
     * Spawns a single vehicle on a random lane at random point
     */
    spawnVehicle(): void {
        const vehicle = this.vehicleSpawner.spawn();

        this.vehicles.push(vehicle);
    }

    /**
     * Spawns the set amount of vehicles on a random lane at random point
     *
     * @param count Number of vehicles to spawn
     */
    spawnVehicles(count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnVehicle();
        }
    }

    /**
     * Triggers the update method on every vehicle
     */
    update(deltaTime: number): void {
        for (const vehicle of this.vehicles) {
            vehicle.update(deltaTime);
        }
    }

    /**
     * Retrieves the vehicle states (position and rotation) of every vehicle in the simulation
     */
    getVehicleStates(): readonly VehicleState[] {
        return this.vehicles.map((vehicle) => vehicle.getState());
    }
}
