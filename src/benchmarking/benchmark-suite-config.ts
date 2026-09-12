import type { RendererType } from '@rendering/renderer-factory';
import type { BenchmarkSuiteSetup } from './benchmark-suite';

const FIXED_MAP_SIZE = 25;
const FIXED_VEHICLE_COUNT = 1000;

const STANDARD_BENCHMARK_SEED = 123456789;

export interface BenchmarkSuiteConfig {
    seed: number;
    warmupMs: number;
    durationMs: number;
    renderers: RendererType[];
    setups: BenchmarkSuiteSetup[];
}

export const standardBenchmarkSuite: BenchmarkSuiteConfig = {
    seed: STANDARD_BENCHMARK_SEED,
    warmupMs: 3000,
    durationMs: 10000,
    renderers: ['dom', 'pixi-webgl'],
    setups: [
        {
            id: 'vehicles-1000',
            name: `${FIXED_MAP_SIZE}x${FIXED_MAP_SIZE} • 1000 vehicles`,
            rows: FIXED_MAP_SIZE,
            columns: FIXED_MAP_SIZE,
            vehicleCount: 1000,
        },
        {
            id: 'vehicles-2000',
            name: `${FIXED_MAP_SIZE}x${FIXED_MAP_SIZE} • 2000 vehicles`,
            rows: FIXED_MAP_SIZE,
            columns: FIXED_MAP_SIZE,
            vehicleCount: 2000,
        },
        {
            id: 'vehicles-4000',
            name: `${FIXED_MAP_SIZE}x${FIXED_MAP_SIZE} • 4000 vehicles`,
            rows: FIXED_MAP_SIZE,
            columns: FIXED_MAP_SIZE,
            vehicleCount: 4000,
        },
        {
            id: 'map-20x20',
            name: `20×20 • ${FIXED_VEHICLE_COUNT} vehicles`,
            rows: 20,
            columns: 20,
            vehicleCount: FIXED_VEHICLE_COUNT,
        },
        {
            id: 'map-40x40',
            name: `40×40 • ${FIXED_VEHICLE_COUNT} vehicles`,
            rows: 40,
            columns: 40,
            vehicleCount: FIXED_VEHICLE_COUNT,
        },
        {
            id: 'map-60x60',
            name: `60×60 • ${FIXED_VEHICLE_COUNT} vehicles`,
            rows: 60,
            columns: 60,
            vehicleCount: FIXED_VEHICLE_COUNT,
        },
    ],
};
