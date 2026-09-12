import { GridGenerator } from '@core/map/grid-generator';
import { RoadMap } from '@core/map/road-map';
import type { RoadNode } from '@core/map/road-node';
import { Pathfinder } from '@core/pathfinding/pathfinder';
import { Movement } from '@core/traffic/movement';
import { MovementGenerator } from '@core/traffic/movement-generator';
import { TrafficLightController } from '@core/traffic/traffic-light-controller';
import { TrafficLightPhaseFactory } from '@core/traffic/traffic-light-phase-factory';
import { TrafficLightSystem } from '@core/traffic/traffic-light-system';
import { DestinationGenerator } from '@core/vehicles/destination-generator';
import { Vehicle } from '@core/vehicles/vehicle';
import { VehicleDetector } from '@core/vehicles/vehicle-detector';
import { VehicleSpawner } from '@core/vehicles/vehicle-spawner';
import type { VehicleState } from '@core/vehicles/vehicle-state';
import type { SimulationConfig } from '@shared/config/simulation-config';

export class Simulation {
    private readonly config: SimulationConfig;
    private readonly roadMap: RoadMap;
    private readonly movements: Map<RoadNode['id'], readonly Movement[]>;
    private readonly trafficLightSystem: TrafficLightSystem;
    private readonly pathfinder: Pathfinder;
    private readonly destinationGenerator: DestinationGenerator;
    private readonly vehicleSpawner: VehicleSpawner;
    private readonly vehicleDetector: VehicleDetector;
    private readonly vehicles: Vehicle[] = [];

    constructor(config: SimulationConfig) {
        this.config = config;
        this.roadMap = this.createRoadMap();
        this.movements = this.createMovements(this.roadMap);
        this.trafficLightSystem = this.createTrafficLightSystem(this.roadMap);
        this.pathfinder = new Pathfinder(this.getMovementsArray());
        this.destinationGenerator = new DestinationGenerator(this.roadMap.getLanes());
        this.vehicleDetector = new VehicleDetector();
        this.vehicleSpawner = new VehicleSpawner(
            this.roadMap.getLanes(),
            this.pathfinder,
            this.destinationGenerator,
            this.config.vehicles,
            this.trafficLightSystem,
            this.vehicleDetector,
        );
        this.spawnVehicles(this.config.vehicles.count);

        /*
         * The detector needs the complete vehicle collection
         * so every vehicle can detect vehicles ahead.
         */
        this.vehicleDetector.addVehicles(this.vehicles);
    }

    /**
     * Triggers the update method on every simulation system.
     */
    update(deltaTime: number): void {
        this.trafficLightSystem.update(deltaTime);

        for (const vehicle of this.vehicles) {
            vehicle.update(deltaTime);
        }
    }

    /**
     * Spawns a single vehicle on a random lane at a random point.
     */
    spawnVehicle(): void {
        const vehicle = this.vehicleSpawner.spawn();

        this.vehicles.push(vehicle);
    }

    /**
     * Spawns the requested number of vehicles.
     */
    spawnVehicles(count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnVehicle();
        }
    }

    private createRoadMap(): RoadMap {
        const generator = new GridGenerator(this.config.grid);

        return generator.generate();
    }

    private createMovements(roadMap: RoadMap): Map<RoadNode['id'], readonly Movement[]> {
        const map = new Map<RoadNode['id'], readonly Movement[]>();

        const generator = new MovementGenerator();

        for (const node of roadMap.getNodes()) {
            map.set(node.getId(), generator.generate(node));
        }

        return map;
    }

    private createTrafficLightSystem(roadMap: RoadMap): TrafficLightSystem {
        const trafficLightSystem = new TrafficLightSystem();

        const trafficLightPhaseFactory = new TrafficLightPhaseFactory(
            this.config.trafficLightsPhase,
        );

        for (const node of roadMap.getNodes()) {
            const nodeId = node.getId();

            const nodeMovements = this.getMovements(nodeId);

            if (!nodeMovements) {
                throw new Error(`Could not find the movements for node with id ${nodeId}`);
            }

            const phases = trafficLightPhaseFactory.createForNode(node, nodeMovements);

            /*
             * No phases means this node is not a
             * controlled intersection.
             */
            if (phases.length === 0) {
                continue;
            }

            const totalLightsDurationCycle =
                this.config.trafficLightsPhase.greenDuration +
                this.config.trafficLightsPhase.yellowDuration +
                this.config.trafficLightsPhase.allRedDuration;

            const initialTime = Math.floor(Math.random() * totalLightsDurationCycle);

            const controller = new TrafficLightController(phases, initialTime);

            trafficLightSystem.add(node, controller);
        }

        return trafficLightSystem;
    }

    getRoadMap(): RoadMap {
        return this.roadMap;
    }

    getMovementsMap(): Map<RoadNode['id'], readonly Movement[]> {
        return this.movements;
    }

    getMovementsArray(): readonly Movement[] {
        const out: Movement[] = [];

        for (const nodeMovements of this.movements.values()) {
            out.push(...nodeMovements);
        }

        return out;
    }

    getMovements(roadNodeId: RoadNode['id']): readonly Movement[] | undefined {
        return this.movements.get(roadNodeId);
    }

    getVehicles(): readonly Vehicle[] {
        return this.vehicles;
    }

    getTrafficLightSystem(): TrafficLightSystem {
        return this.trafficLightSystem;
    }

    getPathfinder(): Pathfinder {
        return this.pathfinder;
    }

    /**
     * Retrieves the vehicle states (position and rotation)
     * of every vehicle in the simulation.
     */
    getVehicleStates(): readonly VehicleState[] {
        return this.vehicles.map((vehicle) => vehicle.getState());
    }
}
