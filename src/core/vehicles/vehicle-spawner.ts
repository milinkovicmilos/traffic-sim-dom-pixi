import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { Vehicle } from './vehicle';
import type { DestinationGenerator } from './destination-generator';
import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';

export class VehicleSpawner {
    private readonly lanes: readonly Lane[];
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;
    private readonly vehicleConfig: VehicleConfig;
    private readonly trafficLightSystem: TrafficLightSystem;

    constructor(
        lanes: readonly Lane[],
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
        vehicleConfig: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
    ) {
        this.lanes = lanes;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
        this.vehicleConfig = vehicleConfig;
        this.trafficLightSystem = trafficLightSystem;
    }

    spawn(): Vehicle {
        const start = this.generateStartLocation();

        const destination = this.destinationGenerator.generate(start);

        const path = this.pathfinder.findPath(start, destination);

        if (path === null) {
            throw new Error('Failed to find a path for spawned vehicle.');
        }

        return new Vehicle(path, this.vehicleConfig, this.trafficLightSystem);
    }

    private generateStartLocation(): PathLocation {
        const lane = this.getRandomLane();

        const distance = Math.random() * lane.getLength();

        return new PathLocation(lane, distance);
    }

    private getRandomLane(): Lane {
        const index = Math.floor(Math.random() * this.lanes.length);

        return this.lanes[index];
    }
}
