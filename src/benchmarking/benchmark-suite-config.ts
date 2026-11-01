import type { RendererType } from '@rendering/renderer-factory';
import type { BenchmarkSuiteSetup } from './benchmark-suite';

const STANDARD_BENCHMARK_SEED = 123456789;

// V: vehicle count scaling on a fixed map.
const VEHICLE_GROUP_MAP_SIZE = 25;
const VEHICLE_GROUP_COUNTS = [100, 250, 500, 1000, 2000, 4000, 8000, 16000];

// M: map size scaling with a fixed vehicle count.
const MAP_GROUP_SIZES = [10, 20, 40, 60];
const MAP_GROUP_VEHICLE_COUNT = 1000;

// S: small maps with few vehicles.
const SMALL_GROUP_SIZES = [5, 10];
const SMALL_GROUP_VEHICLE_COUNT = 100;

export interface BenchmarkSuiteConfig {
    id: string;
    seed: number;
    warmupMs: number;
    durationMs: number;
    renderers: RendererType[];
    setups: BenchmarkSuiteSetup[];
}

function createStandardSetup(
    group: string,
    mapSize: number,
    vehicleCount: number,
): BenchmarkSuiteSetup {
    return {
        id: `${group}-${mapSize}x${mapSize}-${vehicleCount}`,
        name: `${mapSize}x${mapSize} • ${vehicleCount} vehicles`,
        rows: mapSize,
        columns: mapSize,
        vehicleCount,
    };
}

export const standardBenchmarkSuite: BenchmarkSuiteConfig = {
    id: 'standard',
    seed: STANDARD_BENCHMARK_SEED,
    warmupMs: 3000,
    durationMs: 10000,
    renderers: ['dom', 'pixi-webgl', 'pixi-webgpu'],
    setups: [
        ...VEHICLE_GROUP_COUNTS.map((vehicleCount) =>
            createStandardSetup('V', VEHICLE_GROUP_MAP_SIZE, vehicleCount),
        ),
        ...MAP_GROUP_SIZES.map((mapSize) =>
            createStandardSetup('M', mapSize, MAP_GROUP_VEHICLE_COUNT),
        ),
        ...SMALL_GROUP_SIZES.map((mapSize) =>
            createStandardSetup('S', mapSize, SMALL_GROUP_VEHICLE_COUNT),
        ),
    ],
};
