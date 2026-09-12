import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { Vehicle } from './vehicle';
import type { DestinationGenerator } from './destination-generator';
import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import type { VehicleDetector } from './vehicle-detector';
import type { SeededRandom } from '@shared/utils/math/seeded-random';

export class VehicleSpawner {
    private readonly lanes: readonly Lane[];
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;
    private readonly vehicleConfig: VehicleConfig;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly vehicleDetector: VehicleDetector;
    private readonly random: SeededRandom;

    constructor(
        lanes: readonly Lane[],
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
        vehicleConfig: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        vehicleDetector: VehicleDetector,
        random: SeededRandom,
    ) {
        this.lanes = lanes;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
        this.vehicleConfig = vehicleConfig;
        this.trafficLightSystem = trafficLightSystem;
        this.vehicleDetector = vehicleDetector;
        this.random = random;
    }

    spawn(): Vehicle {
        const start = this.generateStartLocation();

        const destination = this.destinationGenerator.generate(start);

        const path = this.pathfinder.findPath(start, destination);

        if (path === null) {
            throw new Error('Failed to find a path for spawned vehicle.');
        }

        return new Vehicle(
            path,
            this.vehicleConfig,
            this.trafficLightSystem,
            this.vehicleDetector,
            this.pathfinder,
            this.destinationGenerator,
        );
    }

    private generateStartLocation(): PathLocation {
        if (this.lanes.length === 0) {
            throw new Error('Cannot spawn a vehicle without lanes.');
        }

        const lane = this.random.pick(this.lanes);

        const distance = this.random.next() * lane.getLength();

        return new PathLocation(lane, distance);
    }
}
