import type { GridConfig } from './grid-config';
import type { TrafficLightPhaseConfig } from './traffic-light-phase-config';
import type { VehicleConfig } from './vehicle-config';

export interface SimulationConfig {
    grid: GridConfig;
    vehicles: VehicleConfig;
    trafficLightsPhase: TrafficLightPhaseConfig;
    seed: number;
}
