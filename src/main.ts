import './style.css';

import { Simulation } from '@core/simulation/simulation';

import type { GridConfig } from '@shared/config/grid-config';
import type { SimulationConfig } from '@shared/config/simulation-config';
import type { TrafficLightPhaseConfig } from '@shared/config/traffic-light-phase-config';
import type { VehicleConfig } from '@shared/config/vehicle-config';

import {
    createRenderer,
    type RendererOptions,
    type RendererType,
} from '@rendering/renderer-factory';

import type { Renderer } from '@rendering/renderer';

import { createRenderState } from '@rendering/render-state';

import { BenchmarkMonitor, type BenchmarkSnapshot } from '@benchmarking/benchmark-monitor';

/* =============================================================
   CONFIG
============================================================= */

const gridConfig: GridConfig = {
    rows: 24,
    columns: 24,
    blockSize: 250,
    roadWidth: 30,
    laneWidth: 15,
    padding: 64,
};

const trafficLightsPhaseConfig: TrafficLightPhaseConfig = {
    greenDuration: 10000,
    yellowDuration: 2000,
    allRedDuration: 3000,
};

const vehiclesConfig: VehicleConfig = {
    acceleration: 10,
    braking: 10,
    followDistance: 25,
    length: 18,
    width: 8,
    maxSpeed: 100,
    count: 100,
    stoppingDistance: 25,
};

const simulationConfig: SimulationConfig = {
    grid: gridConfig,
    trafficLightsPhase: trafficLightsPhaseConfig,
    vehicles: vehiclesConfig,
    seed: Math.random(),
};

/* =============================================================
   APPLICATION UI
============================================================= */

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
    throw new Error('Could not find #app.');
}

app.innerHTML = `
    <div class="simulation-toolbar">
        <h1 class="simulation-title">
            Traffic Simulation
        </h1>

        <label class="renderer-selector">
            <span>Renderer</span>

            <select id="renderer-select">
                <option value="dom">
                    DOM
                </option>

                <option value="pixi-webgl">
                    PixiJS WebGL
                </option>

                <option value="pixi-webgpu">
                    PixiJS WebGPU
                </option>
            </select>
        </label>
    </div>

    <div class="simulation-body">

        <div class="simulation-main">
            <div
                id="simulation-root"
                class="simulation-scroll"
            >
                <div
                    id="simulation-content"
                    class="simulation-content"
                >
                    <div
                        id="dom-renderer-host"
                        class="renderer-host"
                    ></div>

                    <div
                        id="pixi-webgl-renderer-host"
                        class="renderer-host"
                    ></div>

                    <div
                        id="pixi-webgpu-renderer-host"
                        class="renderer-host"
                    ></div>
                </div>
            </div>
        </div>

        <aside
            id="benchmark-panel"
            class="benchmark-panel"
        >
            <div class="benchmark-panel-header">
                <div>
                    <h2>Benchmark</h2>

                    <span
                        id="benchmark-status"
                        class="benchmark-status"
                    >
                        Live
                    </span>
                </div>

                <button
                    id="benchmark-record"
                    class="benchmark-record-button"
                    type="button"
                >
                    Record Snapshot
                </button>
            </div>

            <section class="benchmark-section">
                <h3>Current</h3>

                <div
                    id="benchmark-current"
                    class="benchmark-grid"
                ></div>
            </section>

            <section class="benchmark-section">
                <h3>Snapshot</h3>

                <div
                    id="benchmark-snapshot"
                    class="benchmark-snapshot"
                >
                    <div class="benchmark-empty">
                        No snapshot recorded.
                    </div>
                </div>
            </section>
        </aside>

    </div>
`;

/* =============================================================
   REQUIRED DOM REFERENCES
============================================================= */

function getRequiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Could not find required element: ${selector}`);
    }

    return element;
}

const simulationRoot = getRequiredElement<HTMLElement>('#simulation-content');

const domRendererHost = getRequiredElement<HTMLDivElement>('#dom-renderer-host');

const pixiWebglRendererHost = getRequiredElement<HTMLDivElement>('#pixi-webgl-renderer-host');

const pixiWebgpuRendererHost = getRequiredElement<HTMLDivElement>('#pixi-webgpu-renderer-host');

const rendererSelect = getRequiredElement<HTMLSelectElement>('#renderer-select');

const benchmarkRecord = getRequiredElement<HTMLButtonElement>('#benchmark-record');

const benchmarkStatus = getRequiredElement<HTMLElement>('#benchmark-status');

const benchmarkCurrent = getRequiredElement<HTMLElement>('#benchmark-current');

const benchmarkSnapshot = getRequiredElement<HTMLElement>('#benchmark-snapshot');

simulationRoot.style.position = 'relative';

const rendererHosts: Record<RendererType, HTMLDivElement> = {
    dom: domRendererHost,

    'pixi-webgl': pixiWebglRendererHost,

    'pixi-webgpu': pixiWebgpuRendererHost,
};

for (const host of Object.values(rendererHosts)) {
    host.style.position = 'absolute';

    host.style.inset = '0';

    host.style.display = 'none';
}

domRendererHost.style.display = 'block';

/* =============================================================
   SIMULATION
============================================================= */

const simulation = new Simulation(simulationConfig);

const rendererOptions: RendererOptions = {
    dom: {
        container: domRendererHost,

        padding: gridConfig.padding,

        roadWidth: gridConfig.roadWidth,

        vehicleLength: vehiclesConfig.length,

        vehicleWidth: vehiclesConfig.width,
    },

    pixiWebgl: {
        container: pixiWebglRendererHost,

        padding: gridConfig.padding,

        roadWidth: gridConfig.roadWidth,

        vehicleLength: vehiclesConfig.length,

        vehicleWidth: vehiclesConfig.width,

        preference: 'webgl',
    },

    pixiWebgpu: {
        container: pixiWebgpuRendererHost,

        padding: gridConfig.padding,

        roadWidth: gridConfig.roadWidth,

        vehicleLength: vehiclesConfig.length,

        vehicleWidth: vehiclesConfig.width,

        preference: 'webgpu',
    },
};

const renderers: Record<RendererType, Renderer> = {
    dom: createRenderer('dom', rendererOptions),

    'pixi-webgl': createRenderer('pixi-webgl', rendererOptions),

    'pixi-webgpu': createRenderer('pixi-webgpu', rendererOptions),
};

/* =============================================================
   WEBGPU AVAILABILITY
============================================================= */

async function isWebGPUAvailable(): Promise<boolean> {
    if (!('gpu' in navigator)) {
        return false;
    }

    const gpu = (
        navigator as Navigator & {
            gpu?: {
                requestAdapter: () => Promise<unknown>;
            };
        }
    ).gpu;

    if (!gpu) {
        return false;
    }

    try {
        const adapter = await gpu.requestAdapter();

        return adapter !== null;
    } catch {
        return false;
    }
}

/* =============================================================
   INITIALIZE RENDERERS
============================================================= */

const webgpuAvailable = await isWebGPUAvailable();

if (!webgpuAvailable) {
    const option = rendererSelect.querySelector<HTMLOptionElement>('option[value="pixi-webgpu"]');

    if (option) {
        option.disabled = true;

        option.textContent = 'PixiJS WebGPU (Unavailable)';
    }
}

for (const rendererType of Object.keys(renderers) as RendererType[]) {
    if (rendererType === 'pixi-webgpu' && !webgpuAvailable) {
        continue;
    }

    try {
        await renderers[rendererType].initialize();
    } catch (error) {
        console.warn(`Failed to initialize ${getRendererLabel(rendererType)}.`, error);

        if (rendererType === 'pixi-webgpu') {
            const option = rendererSelect.querySelector<HTMLOptionElement>(
                'option[value="pixi-webgpu"]',
            );

            if (option) {
                option.disabled = true;

                option.textContent = 'PixiJS WebGPU (Unavailable)';
            }
        }
    }
}

/* =============================================================
   BENCHMARKING
============================================================= */

const benchmarkMonitor = new BenchmarkMonitor();

let latestSnapshot: BenchmarkSnapshot | null = null;

/* =============================================================
   ACTIVE RENDERER
============================================================= */

let activeRendererType: RendererType = 'dom';

let activeRenderer: Renderer = renderers.dom;

function isRendererAvailable(type: RendererType): boolean {
    if (type === 'pixi-webgpu') {
        return webgpuAvailable;
    }

    return true;
}

function setActiveRenderer(type: RendererType): void {
    if (benchmarkMonitor.isRecording()) {
        rendererSelect.value = activeRendererType;

        return;
    }

    if (!isRendererAvailable(type)) {
        rendererSelect.value = activeRendererType;

        return;
    }

    activeRendererType = type;

    activeRenderer = renderers[type];

    for (const rendererType of Object.keys(rendererHosts) as RendererType[]) {
        const host = rendererHosts[rendererType];

        host.style.display = rendererType === activeRendererType ? 'block' : 'none';
    }

    activeRenderer.render(createRenderState(simulation));
}

rendererSelect.addEventListener('change', () => {
    setActiveRenderer(rendererSelect.value as RendererType);
});

setActiveRenderer('dom');

/* =============================================================
   BENCHMARK UI
============================================================= */

let benchmarkUiLastUpdated = 0;

function renderBenchmarkCurrent(now: number): void {
    if (now - benchmarkUiLastUpdated < 250) {
        return;
    }

    benchmarkUiLastUpdated = now;

    const metrics = benchmarkMonitor.getCurrentMetrics();

    benchmarkCurrent.innerHTML = `
        ${metric('Renderer', getRendererLabel(activeRendererType))}

        ${metric('FPS', metrics.fps.toFixed(1))}

        ${metric('Frame', `${metrics.frameTimeMs.toFixed(2)} ms`)}

        ${metric('Simulation', `${metrics.simulationTimeMs.toFixed(2)} ms`)}

        ${metric('Renderer time', `${metrics.renderTimeMs.toFixed(2)} ms`)}

        ${metric('Main thread', `${metrics.mainThreadUtilization.toFixed(1)}%`)}

        ${metric(
            'JS heap (Chromium only)',
            metrics.memoryMb === null ? 'N/A' : `${metrics.memoryMb.toFixed(1)} MB`,
        )}

        ${metric('Vehicles', String(metrics.vehicleCount))}

        ${metric('Frame count', String(metrics.frameCount))}

        ${metric('CPU cores', String(benchmarkMonitor.getEnvironment().logicalProcessors))}
    `;
}

function metric(label: string, value: string): string {
    return `
        <div class="benchmark-metric">
            <span class="benchmark-metric-label">
                ${label}
            </span>

            <strong class="benchmark-metric-value">
                ${value}
            </strong>
        </div>
    `;
}

function renderSnapshot(snapshot: BenchmarkSnapshot | null): void {
    if (!snapshot) {
        benchmarkSnapshot.innerHTML = `
            <div class="benchmark-empty">
                No snapshot recorded.
            </div>
        `;

        return;
    }

    const environment = snapshot.environment;

    benchmarkSnapshot.innerHTML = `
        <div class="benchmark-snapshot-meta">
            <span>
                ${getRendererLabel(snapshot.renderer)}
            </span>

            <span>
                ${(snapshot.durationMs / 1000).toFixed(1)}s
            </span>
        </div>

        <div class="benchmark-grid">

            ${metric('Average FPS', snapshot.averageFps.toFixed(1))}

            ${metric('1% low FPS', snapshot.low1PercentFps.toFixed(1))}

            ${metric('Avg frame', `${snapshot.averageFrameTime.toFixed(2)} ms`)}

            ${metric('P95 frame', `${snapshot.p95FrameTime.toFixed(2)} ms`)}

            ${metric('Avg simulation', `${snapshot.averageSimulationTime.toFixed(2)} ms`)}

            ${metric('P95 simulation', `${snapshot.p95SimulationTime.toFixed(2)} ms`)}

            ${metric('Avg renderer', `${snapshot.averageRenderTime.toFixed(2)} ms`)}

            ${metric('P95 renderer', `${snapshot.p95RenderTime.toFixed(2)} ms`)}

            ${metric('Main thread', `${snapshot.averageMainThreadUtilization.toFixed(1)}%`)}

            ${metric('Peak main thread', `${snapshot.peakMainThreadUtilization.toFixed(1)}%`)}

            ${metric('Memory start', formatMemory(snapshot.memoryStartMb))}

            ${metric('Memory end', formatMemory(snapshot.memoryEndMb))}

            ${metric('Memory peak', formatMemory(snapshot.memoryPeakMb))}

            ${metric('Vehicles', String(snapshot.vehicleCount))}

            ${metric('Map', `${snapshot.rows} × ${snapshot.columns}`)}

            ${metric('CPU cores', String(environment.logicalProcessors))}

            ${metric(
                'Device memory',
                environment.deviceMemoryGb === null ? 'N/A' : `${environment.deviceMemoryGb} GB`,
            )}

        </div>

        <button
            id="benchmark-copy"
            class="benchmark-copy-button"
            type="button"
        >
            Copy Snapshot
        </button>
    `;

    const copyButton = benchmarkSnapshot.querySelector<HTMLButtonElement>('#benchmark-copy');

    copyButton?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
        } catch {
            console.warn('Could not copy benchmark snapshot to clipboard.');
        }
    });
}

function formatMemory(value: number | null): string {
    return value === null ? 'N/A' : `${value.toFixed(1)} MB`;
}

function getRendererLabel(type: RendererType): string {
    switch (type) {
        case 'dom':
            return 'DOM';

        case 'pixi-webgl':
            return 'PixiJS WebGL';

        case 'pixi-webgpu':
            return 'PixiJS WebGPU';
    }
}

/* =============================================================
   BENCHMARK RECORDING
============================================================= */

benchmarkRecord.addEventListener('click', () => {
    if (benchmarkMonitor.isRecording()) {
        latestSnapshot = benchmarkMonitor.stopRecording(
            activeRendererType,
            simulation.getVehicles().length,
            gridConfig.rows,
            gridConfig.columns,
        );

        benchmarkStatus.textContent = 'Complete';

        benchmarkRecord.textContent = 'Record Snapshot';

        rendererSelect.disabled = false;

        renderSnapshot(latestSnapshot);

        renderBenchmarkCurrent(performance.now());

        return;
    }

    benchmarkMonitor.startRecording(activeRendererType);

    benchmarkStatus.textContent = 'Recording…';

    benchmarkRecord.textContent = 'Stop Recording';

    rendererSelect.disabled = true;
});

/* =============================================================
   SIMULATION LOOP
============================================================= */

let previousTime = performance.now();

function frame(currentTime: number): void {
    const frameStart = performance.now();

    const deltaTime = Math.min(currentTime - previousTime, 100);

    previousTime = currentTime;

    const simulationStart = performance.now();

    simulation.update(deltaTime);

    const simulationTime = performance.now() - simulationStart;

    const renderState = createRenderState(simulation);

    const renderStart = performance.now();

    activeRenderer.render(renderState);

    const renderTime = performance.now() - renderStart;

    const frameTime = performance.now() - frameStart;

    benchmarkMonitor.recordFrame(
        currentTime,
        frameTime,
        simulationTime,
        renderTime,
        simulation.getVehicles().length,
    );

    renderBenchmarkCurrent(currentTime);

    requestAnimationFrame(frame);
}

/* =============================================================
   INITIAL STATE
============================================================= */

renderSnapshot(latestSnapshot);

requestAnimationFrame(frame);
