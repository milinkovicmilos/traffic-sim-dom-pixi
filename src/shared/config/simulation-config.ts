import type { GridConfig } from './grid-config';
import type { TrafficLightConfig } from './traffic-light-config';
import type { VehicleConfig } from './vehicle-config';

export interface SimulationConfig {
    grid: GridConfig;
    vehicles: VehicleConfig;
    trafficLights: TrafficLightConfig;
    seed: number;
}
