import type { Pathfinder } from '@core/pathfinding/pathfinder';
import { Vehicle } from './vehicle';
import type { DestinationGenerator } from './destination-generator';
import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';

export class VehicleSpawner {
    private readonly lanes: readonly Lane[];
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;

    constructor(
        lanes: readonly Lane[],
        pathfinder: Pathfinder,
        destinationGenerator: DestinationGenerator,
    ) {
        this.lanes = lanes;
        this.pathfinder = pathfinder;
        this.destinationGenerator = destinationGenerator;
    }

    spawn(): Vehicle {
        const start = this.generateStartLocation();

        const destination = this.destinationGenerator.generate(start);

        const path = this.pathfinder.findPath(start, destination);
        console.log(this.pathfinder);
        console.log(this.lanes);
        console.log(destination);

        if (path === null) {
            throw new Error('Failed to find a path for spawned vehicle.');
        }

        return new Vehicle(path, this.getRandomSpeed());
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

    private getRandomSpeed(): number {
        // Temporary value until vehicle speed
        // configuration is introduced.
        return 10;
    }
}
