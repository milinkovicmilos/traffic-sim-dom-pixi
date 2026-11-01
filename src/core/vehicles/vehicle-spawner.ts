import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { Vehicle } from './vehicle';
import type { DestinationGenerator } from './destination-generator';
import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { VehicleConfig } from '@shared/config/vehicle-config';
import type { IntersectionReservations } from '@core/traffic/intersection-reservations';
import type { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import type { VehicleDetector } from './vehicle-detector';
import type { SeededRandom } from '@shared/utils/math/seeded-random';

export class VehicleSpawner {
    private readonly lanes: readonly Lane[];
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;
    private readonly vehicleConfig: VehicleConfig;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly intersectionReservations: IntersectionReservations;
    private readonly vehicleDetector: VehicleDetector;
    private readonly random: SeededRandom;
    private readonly freeStartLocations: PathLocation[];

    constructor(
        lanes: readonly Lane[],
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
        vehicleConfig: VehicleConfig,
        trafficLightSystem: TrafficLightSystem,
        intersectionReservations: IntersectionReservations,
        vehicleDetector: VehicleDetector,
        random: SeededRandom,
    ) {
        this.lanes = lanes;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
        this.vehicleConfig = vehicleConfig;
        this.trafficLightSystem = trafficLightSystem;
        this.intersectionReservations = intersectionReservations;
        this.vehicleDetector = vehicleDetector;
        this.random = random;
        this.freeStartLocations = this.createStartLocations();
    }

    spawn(): Vehicle {
        const start = this.takeStartLocation();

        const destination = this.destinationGenerator.generate(start);

        const path = this.pathfinder.findPath(start, destination);

        if (path === null) {
            throw new Error('Failed to find a path for spawned vehicle.');
        }

        return new Vehicle(
            path,
            this.vehicleConfig,
            this.trafficLightSystem,
            this.intersectionReservations,
            this.vehicleDetector,
            this.pathfinder,
            this.destinationGenerator,
        );
    }

    // Spaced so that no two vehicles start overlapping, and clear of the lane ends.
    private createStartLocations(): PathLocation[] {
        const { length, minimumGap, stoppingDistance } = this.vehicleConfig;
        const locations: PathLocation[] = [];

        for (const lane of this.lanes) {
            const lastDistance = lane.getLength() - stoppingDistance;

            for (
                let distance = stoppingDistance;
                distance <= lastDistance;
                distance += length + minimumGap
            ) {
                locations.push(new PathLocation(lane, distance));
            }
        }

        return locations;
    }

    private takeStartLocation(): PathLocation {
        const locations = this.freeStartLocations;

        if (locations.length === 0) {
            throw new Error('The map has no room left for another vehicle.');
        }

        const index = this.random.nextInt(0, locations.length - 1);
        const location = locations[index];

        locations[index] = locations[locations.length - 1];
        locations.pop();

        return location;
    }
}
