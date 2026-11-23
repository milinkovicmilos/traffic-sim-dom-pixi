import type { RendererType } from '@rendering/renderer-factory';
import type { BenchmarkSuiteSetup } from './benchmark-suite';

const STANDARD_BENCHMARK_SEED = 123456789;

// V: vehicle count scaling on a fixed map.
const VEHICLE_GROUP_MAP_SIZE = 30;
const VEHICLE_GROUP_COUNTS = [100, 250, 500, 1000, 2000, 4000, 8000, 16000];

// M: map size scaling with a fixed vehicle count.
const MAP_GROUP_SIZES = [10, 20, 40, 60];
const MAP_GROUP_VEHICLE_COUNT = 1000;

// S: small maps with few vehicles, without traffic-light timers.
const SMALL_GROUP_SIZES = [5, 10];
const SMALL_GROUP_VEHICLE_COUNT = 100;

// P: vehicle count scaling on a small map, without traffic-light timers.
const SMALL_MAP_GROUP_SIZE = 10;
const SMALL_MAP_GROUP_COUNTS = [100, 250, 500];

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
    trafficLightTimers = true,
): BenchmarkSuiteSetup {
    const timerSuffix = trafficLightTimers ? '' : '-notimers';
    const timerLabel = trafficLightTimers ? '' : ' • no timers';

    return {
        id: `${group}-${mapSize}x${mapSize}-${vehicleCount}${timerSuffix}`,
        name: `${mapSize}x${mapSize} • ${vehicleCount} vehicles${timerLabel}`,
        rows: mapSize,
        columns: mapSize,
        vehicleCount,
        trafficLightTimers,
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
            createStandardSetup('S', mapSize, SMALL_GROUP_VEHICLE_COUNT, false),
        ),
        ...SMALL_MAP_GROUP_COUNTS.map((vehicleCount) =>
            createStandardSetup('P', SMALL_MAP_GROUP_SIZE, vehicleCount, false),
        ),
    ],
};
