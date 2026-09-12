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

import {
    BenchmarkSuiteRunner,
    type BenchmarkSuiteRunResult,
    type BenchmarkSuiteSetup,
} from '@benchmarking/benchmark-suite';

import {
    standardBenchmarkSuite,
    type BenchmarkSuiteConfig,
} from '@benchmarking/benchmark-suite-config';

/* =============================================================
   CONFIG
============================================================= */

const gridConfig: GridConfig = {
    rows: 5,
    columns: 5,
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
    acceleration: 30,
    braking: 50,
    length: 18,
    width: 8,
    maxSpeed: 50,
    count: 100,
    followDistance: 20,
    minimumGap: 15,
    stoppingDistance: 35,
};

function generateRandomSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0;
}

let currentSimulationSeed = generateRandomSeed();

function createSimulationConfig(): SimulationConfig {
    return {
        grid: {
            ...gridConfig,
        },

        trafficLightsPhase: {
            ...trafficLightsPhaseConfig,
        },

        vehicles: {
            ...vehiclesConfig,
        },

        seed: currentSimulationSeed,
    };
}

/* =============================================================
   CUSTOM BENCHMARK SUITE DEFAULTS
============================================================= */

let customBenchmarkSuiteConfig: BenchmarkSuiteConfig = {
    seed: generateRandomSeed(),
    warmupMs: 3000,
    durationMs: 10000,
    renderers: ['dom', 'pixi-webgl', 'pixi-webgpu'],
    setups: [
        {
            id: 'setup-1',
            name: 'Baseline',
            rows: gridConfig.rows,
            columns: gridConfig.columns,
            vehicleCount: vehiclesConfig.count,
        },
    ],
};

let benchmarkSuiteRunning = false;

let benchmarkSuiteResults: BenchmarkSuiteRunResult[] = [];

/* =============================================================
   APPLICATION UI
============================================================= */

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
    throw new Error('Could not find #app.');
}

app.innerHTML = `
    <div class="simulation-toolbar">
        <div class="simulation-toolbar-left">
            <h1 class="simulation-title">
                Traffic Simulation
            </h1>
            <div class="scenario-controls">
                <label class="scenario-control">
                    <span>Rows</span>
                    <input
                        id="rows-input"
                        type="number"
                        min="2"
                        step="1"
                        value="${gridConfig.rows}"
                        inputmode="numeric"
                    />
                </label>
                <label class="scenario-control">
                    <span>Columns</span>
                    <input
                        id="columns-input"
                        type="number"
                        min="2"
                        step="1"
                        value="${gridConfig.columns}"
                        inputmode="numeric"
                    />
                </label>
                <label class="scenario-control">
                    <span>Vehicles</span>
                    <input
                        id="vehicles-input"
                        type="number"
                        min="1"
                        step="1"
                        value="${vehiclesConfig.count}"
                        inputmode="numeric"
                    />
                </label>
            </div>
        </div>
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
                <div class="benchmark-panel-actions">
                    <button
                        id="benchmark-configure"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Configure Suite
                    </button>
                    <button
                        id="benchmark-suite-run"
                        class="benchmark-record-button benchmark-primary-button"
                        type="button"
                    >
                        Run Standard Suite
                    </button>
                    <button
                        id="benchmark-record"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Record Snapshot
                    </button>
                </div>
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
    <div
        id="benchmark-config-modal"
        class="benchmark-modal"
        hidden
    >
        <div
            class="benchmark-modal-backdrop"
            data-close-modal="benchmark-config-modal"
        ></div>
        <div
            class="benchmark-modal-dialog benchmark-config-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-config-title"
        >
            <div class="benchmark-modal-header">
                <div>
                    <h2 id="benchmark-config-title">
                        Custom Benchmark Suite
                    </h2>
                    <p>
                        Configure a custom benchmark sequence and scenario setups.
                    </p>
                </div>
                <button
                    id="benchmark-config-close"
                    class="benchmark-modal-close"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            <div class="benchmark-config-content">
                <div class="benchmark-config-global">
                    <label class="benchmark-config-field">
                        <span>Warmup (ms)</span>
                        <input
                            id="suite-warmup-input"
                            type="number"
                            min="0"
                            step="500"
                        />
                    </label>
                    <label class="benchmark-config-field">
                        <span>Recording (ms)</span>
                        <input
                            id="suite-duration-input"
                            type="number"
                            min="100"
                            step="500"
                        />
                    </label>
                </div>
                <div class="benchmark-config-group">
                    <div class="benchmark-config-group-header">
                        <div>
                            <h3>Renderers</h3>
                            <span>
                                Runs are executed in the order shown.
                            </span>
                        </div>
                    </div>
                    <div
                        id="suite-renderer-options"
                        class="benchmark-renderer-options"
                    ></div>
                </div>
                <div class="benchmark-config-group">
                    <div class="benchmark-config-group-header">
                        <div>
                            <h3>Scenario setups</h3>
                            <span>
                                Each setup runs once per selected renderer.
                            </span>
                        </div>
                        <button
                            id="suite-add-setup"
                            class="benchmark-record-button"
                            type="button"
                        >
                            Add Setup
                        </button>
                    </div>
                    <div
                        id="suite-setups"
                        class="benchmark-setups"
                    ></div>
                </div>
            </div>
            <div class="benchmark-modal-footer">
                <button
                    id="benchmark-config-cancel"
                    class="benchmark-record-button"
                    type="button"
                >
                    Close
                </button>
                <button
                    id="benchmark-config-run"
                    class="benchmark-record-button benchmark-primary-button"
                    type="button"
                >
                    Run Custom Suite
                </button>
            </div>
        </div>
    </div>
    <div
        id="benchmark-results-modal"
        class="benchmark-modal"
        hidden
    >
        <div
            class="benchmark-modal-backdrop"
            data-close-modal="benchmark-results-modal"
        ></div>
        <div
            class="benchmark-modal-dialog benchmark-results-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-results-title"
        >
            <div class="benchmark-modal-header">
                <div>
                    <h2 id="benchmark-results-title">
                        Benchmark Results
                    </h2>
                    <p
                        id="benchmark-results-summary"
                    ></p>
                </div>
                <button
                    id="benchmark-results-close"
                    class="benchmark-modal-close"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            <div
                id="benchmark-results-content"
                class="benchmark-results-content"
            ></div>
            <div class="benchmark-modal-footer">
                <button
                    id="benchmark-results-copy"
                    class="benchmark-record-button"
                    type="button"
                >
                    Copy JSON
                </button>
                <button
                    id="benchmark-results-footer-close"
                    class="benchmark-record-button benchmark-primary-button"
                    type="button"
                >
                    Close
                </button>
            </div>
        </div>
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

const rowsInput = getRequiredElement<HTMLInputElement>('#rows-input');

const columnsInput = getRequiredElement<HTMLInputElement>('#columns-input');

const vehiclesInput = getRequiredElement<HTMLInputElement>('#vehicles-input');

const benchmarkRecord = getRequiredElement<HTMLButtonElement>('#benchmark-record');

const benchmarkConfigure = getRequiredElement<HTMLButtonElement>('#benchmark-configure');

const benchmarkSuiteRun = getRequiredElement<HTMLButtonElement>('#benchmark-suite-run');

const benchmarkStatus = getRequiredElement<HTMLElement>('#benchmark-status');

const benchmarkCurrent = getRequiredElement<HTMLElement>('#benchmark-current');

const benchmarkSnapshot = getRequiredElement<HTMLElement>('#benchmark-snapshot');

const benchmarkConfigModal = getRequiredElement<HTMLDivElement>('#benchmark-config-modal');

const benchmarkResultsModal = getRequiredElement<HTMLDivElement>('#benchmark-results-modal');

const benchmarkConfigClose = getRequiredElement<HTMLButtonElement>('#benchmark-config-close');

const benchmarkConfigCancel = getRequiredElement<HTMLButtonElement>('#benchmark-config-cancel');

const benchmarkConfigRun = getRequiredElement<HTMLButtonElement>('#benchmark-config-run');

const suiteWarmupInput = getRequiredElement<HTMLInputElement>('#suite-warmup-input');

const suiteDurationInput = getRequiredElement<HTMLInputElement>('#suite-duration-input');

const suiteRendererOptions = getRequiredElement<HTMLDivElement>('#suite-renderer-options');

const suiteSetups = getRequiredElement<HTMLDivElement>('#suite-setups');

const suiteAddSetup = getRequiredElement<HTMLButtonElement>('#suite-add-setup');

const benchmarkResultsClose = getRequiredElement<HTMLButtonElement>('#benchmark-results-close');

const benchmarkResultsFooterClose = getRequiredElement<HTMLButtonElement>(
    '#benchmark-results-footer-close',
);

const benchmarkResultsCopy = getRequiredElement<HTMLButtonElement>('#benchmark-results-copy');

const benchmarkResultsContent = getRequiredElement<HTMLDivElement>('#benchmark-results-content');

const benchmarkResultsSummary = getRequiredElement<HTMLElement>('#benchmark-results-summary');

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

/* =============================================================
   BENCHMARKING
============================================================= */

const benchmarkMonitor = new BenchmarkMonitor();

let latestSnapshot: BenchmarkSnapshot | null = null;

function getBenchmarkSuiteTotalRuns(suite: BenchmarkSuiteConfig): number {
    return suite.setups.length * suite.renderers.length;
}

/* =============================================================
   WEBGPU
============================================================= */

let webgpuAvailable = false;

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

function updateWebGPUOption(): void {
    const option = rendererSelect.querySelector<HTMLOptionElement>('option[value="pixi-webgpu"]');

    if (!option) {
        return;
    }

    option.disabled = !webgpuAvailable;

    option.textContent = webgpuAvailable ? 'PixiJS WebGPU' : 'PixiJS WebGPU (Unavailable)';

    renderSuiteRendererOptions();
}

function isRendererAvailable(type: RendererType): boolean {
    if (type === 'pixi-webgpu') {
        return webgpuAvailable;
    }

    return true;
}

/* =============================================================
   SIMULATION
============================================================= */

let simulation = new Simulation(createSimulationConfig());

/* =============================================================
   RENDERERS
============================================================= */

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

let activeRendererType: RendererType = 'dom';

let activeRenderer: Renderer = renderers.dom;

/*
 * Only the currently initialized renderer is guaranteed to
 * have a live rendering context/DOM scene.
 */
const initializedRenderers = new Set<RendererType>();

/*
 * Prevent two asynchronous renderer operations from running
 * simultaneously.
 */
let rendererOperationInProgress = false;

/*
 * Prevent simulation/render work while the scenario is being
 * rebuilt.
 */
let restartInProgress = false;

/* =============================================================
   RENDERER HELPERS
============================================================= */

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

function showRendererHost(type: RendererType): void {
    for (const rendererType of Object.keys(rendererHosts) as RendererType[]) {
        rendererHosts[rendererType].style.display = rendererType === type ? 'block' : 'none';
    }
}

async function initializeRenderer(type: RendererType): Promise<boolean> {
    if (initializedRenderers.has(type)) {
        return true;
    }

    if (!isRendererAvailable(type)) {
        return false;
    }

    try {
        await renderers[type].initialize();

        initializedRenderers.add(type);

        return true;
    } catch (error) {
        console.error(`Failed to initialize ${getRendererLabel(type)}.`, error);

        if (type === 'pixi-webgpu') {
            webgpuAvailable = false;

            updateWebGPUOption();
        }

        return false;
    }
}

function renderCurrentState(): void {
    activeRenderer.render(createRenderState(simulation));
}

/* =============================================================
   RENDERER SWITCHING
============================================================= */

async function switchRenderer(type: RendererType): Promise<void> {
    if (
        restartInProgress ||
        rendererOperationInProgress ||
        benchmarkSuiteRunning ||
        benchmarkMonitor.isRecording()
    ) {
        rendererSelect.value = activeRendererType;

        return;
    }

    await switchRendererInternal(type);
}

async function switchRendererInternal(type: RendererType): Promise<boolean> {
    if (type === activeRendererType) {
        showRendererHost(activeRendererType);

        if (initializedRenderers.has(activeRendererType)) {
            renderCurrentState();
        }

        return true;
    }

    if (!isRendererAvailable(type)) {
        rendererSelect.value = activeRendererType;

        return false;
    }

    rendererOperationInProgress = true;

    try {
        const initialized = await initializeRenderer(type);

        if (!initialized) {
            rendererSelect.value = activeRendererType;

            return false;
        }

        activeRendererType = type;

        activeRenderer = renderers[type];

        rendererSelect.value = activeRendererType;

        showRendererHost(activeRendererType);

        /*
         * A renderer switch starts a new live benchmark session.
         *
         * An active benchmark recording cannot be switched, so
         * there is no recording data to preserve here.
         */
        if (!benchmarkMonitor.isRecording()) {
            benchmarkMonitor.resetLiveMetrics(activeRendererType, simulation.getVehicles().length);
        }

        renderCurrentState();

        benchmarkUiLastUpdated = 0;

        renderBenchmarkCurrent(performance.now());

        return true;
    } finally {
        rendererOperationInProgress = false;
    }
}

rendererSelect.addEventListener('change', () => {
    void switchRenderer(rendererSelect.value as RendererType);
});

/* =============================================================
   SCENARIO INPUT
============================================================= */

function setScenarioControlsDisabled(disabled: boolean): void {
    rowsInput.disabled = disabled;

    columnsInput.disabled = disabled;

    vehiclesInput.disabled = disabled;
}

function parseScenarioInteger(input: HTMLInputElement, label: string, minimum: number): number {
    const value = Number.parseInt(input.value, 10);

    if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
    }

    return value;
}

/* =============================================================
   SCENARIO REBUILD
============================================================= */

async function rebuildSimulation(
    nextRows: number,
    nextColumns: number,
    nextVehicleCount: number,
    options: {
        force: boolean;
        updateInputs: boolean;
    },
): Promise<void> {
    if (restartInProgress) {
        return;
    }

    if (
        !options.force &&
        nextRows === gridConfig.rows &&
        nextColumns === gridConfig.columns &&
        nextVehicleCount === vehiclesConfig.count
    ) {
        return;
    }

    restartInProgress = true;

    try {
        gridConfig.rows = nextRows;

        gridConfig.columns = nextColumns;

        vehiclesConfig.count = nextVehicleCount;

        if (options.updateInputs) {
            rowsInput.value = String(nextRows);

            columnsInput.value = String(nextColumns);

            vehiclesInput.value = String(nextVehicleCount);
        }

        const nextSimulation = new Simulation(createSimulationConfig());

        const rendererType = activeRendererType;

        activeRenderer.destroy();

        initializedRenderers.delete(rendererType);

        const initialized = await initializeRenderer(rendererType);

        if (!initialized) {
            throw new Error(`Failed to reinitialize ${getRendererLabel(rendererType)}.`);
        }

        simulation = nextSimulation;

        benchmarkMonitor.resetLiveMetrics(activeRendererType, simulation.getVehicles().length);

        showRendererHost(activeRendererType);

        renderCurrentState();
    } finally {
        restartInProgress = false;

        previousTime = performance.now();
    }
}

async function restartSimulation(): Promise<void> {
    if (
        restartInProgress ||
        rendererOperationInProgress ||
        benchmarkSuiteRunning ||
        benchmarkMonitor.isRecording()
    ) {
        return;
    }

    let nextRows: number;
    let nextColumns: number;
    let nextVehicleCount: number;

    try {
        nextRows = parseScenarioInteger(rowsInput, 'Rows', 2);

        nextColumns = parseScenarioInteger(columnsInput, 'Columns', 2);

        nextVehicleCount = parseScenarioInteger(vehiclesInput, 'Vehicles', 1);
    } catch (error) {
        console.error('Invalid scenario configuration.', error);

        rowsInput.value = String(gridConfig.rows);

        columnsInput.value = String(gridConfig.columns);

        vehiclesInput.value = String(vehiclesConfig.count);

        return;
    }

    try {
        await rebuildSimulation(nextRows, nextColumns, nextVehicleCount, {
            force: false,
            updateInputs: true,
        });

        latestSnapshot = null;

        renderSnapshot(null);

        benchmarkStatus.textContent = 'Live';
    } catch (error) {
        console.error('Could not restart simulation.', error);
    }
}

rowsInput.addEventListener('change', () => {
    void restartSimulation();
});

columnsInput.addEventListener('change', () => {
    void restartSimulation();
});

vehiclesInput.addEventListener('change', () => {
    void restartSimulation();
});

for (const input of [rowsInput, columnsInput, vehiclesInput]) {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            input.blur();
        }
    });
}

/* =============================================================
   BENCHMARK CURRENT UI
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
            <span class="benchmark-metric-label">${escapeHtml(label)}</span>
            <strong class="benchmark-metric-value">${escapeHtml(value)}</strong>
        </div>
    `;
}

/* =============================================================
   BENCHMARK SNAPSHOT UI
============================================================= */

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
                ${escapeHtml(getRendererLabel(snapshot.renderer))}
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
            type="button">
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

/* =============================================================
   BENCHMARK RECORDING
============================================================= */

benchmarkRecord.addEventListener('click', () => {
    if (benchmarkSuiteRunning || rendererOperationInProgress || restartInProgress) {
        return;
    }

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

        setScenarioControlsDisabled(false);

        benchmarkSuiteRun.disabled = false;

        benchmarkConfigure.disabled = false;

        renderSnapshot(latestSnapshot);

        renderBenchmarkCurrent(performance.now());

        return;
    }

    benchmarkMonitor.startRecording(activeRendererType);

    benchmarkStatus.textContent = 'Recording…';

    benchmarkRecord.textContent = 'Stop Recording';

    rendererSelect.disabled = true;

    setScenarioControlsDisabled(true);

    benchmarkSuiteRun.disabled = true;

    benchmarkConfigure.disabled = true;
});

/* =============================================================
   CUSTOM SUITE CONFIG UI
============================================================= */

function renderSuiteRendererOptions(): void {
    suiteRendererOptions.innerHTML = (['dom', 'pixi-webgl', 'pixi-webgpu'] as RendererType[])
        .map((renderer) => {
            const checked = customBenchmarkSuiteConfig.renderers.includes(renderer);

            const disabled = !isRendererAvailable(renderer);

            return `
                <label class="benchmark-renderer-option">
                    <input
                        type="checkbox"
                        data-suite-renderer="${renderer}"
                        ${checked && !disabled ? 'checked' : ''}
                        ${disabled ? 'disabled' : ''}
                    />
                    <span>
                        ${escapeHtml(getRendererLabel(renderer))}
                    </span>
                    ${
                        disabled
                            ? `
                                <small>
                                    Unavailable
                                </small>
                            `
                            : ''
                    }
                </label>
            `;
        })
        .join('');
}

function renderSuiteSetups(): void {
    suiteSetups.innerHTML = customBenchmarkSuiteConfig.setups
        .map(
            (setup, index) => `
                    <div
                        class="benchmark-setup-row"
                        data-setup-id="${escapeHtml(setup.id)}"
                    >
                        <div class="benchmark-setup-index">
                            ${index + 1}
                        </div>
                        <label class="benchmark-config-field">
                            <span>Name</span>
                            <input
                                type="text"
                                data-field="name"
                                value="${escapeHtml(setup.name)}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Rows</span>
                            <input
                                type="number"
                                min="2"
                                step="1"
                                data-field="rows"
                                value="${setup.rows}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Columns</span>
                            <input
                                type="number"
                                min="2"
                                step="1"
                                data-field="columns"
                                value="${setup.columns}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Vehicles</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                data-field="vehicleCount"
                                value="${setup.vehicleCount}"
                            />
                        </label>
                        <button
                            class="benchmark-remove-setup"
                            type="button"
                            data-remove-setup="${escapeHtml(setup.id)}"
                            ${customBenchmarkSuiteConfig.setups.length <= 1 ? 'disabled' : ''}
                        >
                            Remove
                        </button>
                    </div>
                `,
        )
        .join('');
}

function openBenchmarkConfigModal(): void {
    suiteWarmupInput.value = String(customBenchmarkSuiteConfig.warmupMs);

    suiteDurationInput.value = String(customBenchmarkSuiteConfig.durationMs);

    renderSuiteRendererOptions();

    renderSuiteSetups();

    benchmarkConfigModal.hidden = false;
}

function closeBenchmarkConfigModal(): void {
    benchmarkConfigModal.hidden = true;
}

function readBenchmarkSetupsFromUi(): BenchmarkSuiteSetup[] {
    const setupRows = Array.from(suiteSetups.querySelectorAll<HTMLElement>('.benchmark-setup-row'));

    if (setupRows.length === 0) {
        throw new Error('Add at least one setup.');
    }

    return setupRows.map((row, index) => {
        const id = row.dataset.setupId ?? `setup-${index + 1}`;

        const nameInput = getInput(row, 'name');

        const rowsInput = getInput(row, 'rows');

        const columnsInput = getInput(row, 'columns');

        const vehicleCountInput = getInput(row, 'vehicleCount');

        const name = nameInput.value.trim() || `Setup ${index + 1}`;

        const rows = parseIntegerValue(rowsInput, `Rows for ${name}`, 2);

        const columns = parseIntegerValue(columnsInput, `Columns for ${name}`, 2);

        const vehicleCount = parseIntegerValue(vehicleCountInput, `Vehicles for ${name}`, 1);

        return {
            id,
            name,
            rows,
            columns,
            vehicleCount,
        };
    });
}

function readBenchmarkSuiteConfigFromUi(): BenchmarkSuiteConfig {
    const warmupMs = parseNonNegativeInteger(suiteWarmupInput, 'Warmup duration');

    const durationMs = parsePositiveInteger(suiteDurationInput, 'Recording duration');

    const selectedRenderers = Array.from(
        suiteRendererOptions.querySelectorAll<HTMLInputElement>(
            'input[data-suite-renderer]:checked',
        ),
    ).map((input) => input.dataset.suiteRenderer as RendererType);

    if (selectedRenderers.length === 0) {
        throw new Error('Select at least one renderer.');
    }

    return {
        seed: currentSimulationSeed,
        warmupMs,
        durationMs,
        renderers: selectedRenderers,
        setups: readBenchmarkSetupsFromUi(),
    };
}

function getInput(container: HTMLElement, field: string): HTMLInputElement {
    const input = container.querySelector<HTMLInputElement>(`input[data-field="${field}"]`);

    if (!input) {
        throw new Error(`Could not find setup field: ${field}`);
    }

    return input;
}

function parseNonNegativeInteger(input: HTMLInputElement, label: string): number {
    return parseIntegerValue(input, label, 0);
}

function parsePositiveInteger(input: HTMLInputElement, label: string): number {
    return parseIntegerValue(input, label, 1);
}

function parseIntegerValue(input: HTMLInputElement, label: string, minimum: number): number {
    const value = Number.parseInt(input.value, 10);

    if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
    }

    return value;
}

suiteAddSetup.addEventListener('click', () => {
    try {
        const currentSetups = readBenchmarkSetupsFromUi();

        customBenchmarkSuiteConfig.setups = currentSetups;

        const index = customBenchmarkSuiteConfig.setups.length + 1;

        customBenchmarkSuiteConfig.setups.push({
            id: `setup-${Date.now()}-${index}`,
            name: `Setup ${index}`,
            rows: gridConfig.rows,
            columns: gridConfig.columns,
            vehicleCount: vehiclesConfig.count,
        });

        renderSuiteSetups();
    } catch (error) {
        console.error('Could not add benchmark setup.', error);

        window.alert(error instanceof Error ? error.message : String(error));
    }
});

suiteSetups.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const setupId = target.dataset.removeSetup;

    if (!setupId) {
        return;
    }

    if (customBenchmarkSuiteConfig.setups.length <= 1) {
        return;
    }

    try {
        customBenchmarkSuiteConfig.setups = readBenchmarkSetupsFromUi();
    } catch (error) {
        console.error('Could not save benchmark setups.', error);

        window.alert(error instanceof Error ? error.message : String(error));

        return;
    }

    customBenchmarkSuiteConfig.setups = customBenchmarkSuiteConfig.setups.filter(
        (setup) => setup.id !== setupId,
    );

    renderSuiteSetups();
});

benchmarkConfigure.addEventListener('click', () => {
    if (benchmarkSuiteRunning || benchmarkMonitor.isRecording()) {
        return;
    }

    openBenchmarkConfigModal();
});

benchmarkConfigClose.addEventListener('click', closeBenchmarkConfigModal);

benchmarkConfigCancel.addEventListener('click', closeBenchmarkConfigModal);

for (const backdrop of document.querySelectorAll<HTMLElement>('[data-close-modal]')) {
    backdrop.addEventListener('click', () => {
        const modalId = backdrop.dataset.closeModal;

        if (modalId === 'benchmark-config-modal') {
            closeBenchmarkConfigModal();
        }

        if (modalId === 'benchmark-results-modal') {
            closeBenchmarkResultsModal();
        }
    });
}

/* =============================================================
   BENCHMARK SUITE RUNNER
============================================================= */

const benchmarkSuiteRunner = new BenchmarkSuiteRunner(benchmarkMonitor, {
    prepareRun: async (setup, renderer, seed) => {
        currentSimulationSeed = seed;

        await rebuildSimulation(setup.rows, setup.columns, setup.vehicleCount, {
            force: true,
            updateInputs: true,
        });

        return switchRendererInternal(renderer);
    },

    getVehicleCount: () => simulation.getVehicles().length,
});

function setBenchmarkSuiteControlsDisabled(disabled: boolean): void {
    benchmarkConfigure.disabled = disabled;

    benchmarkSuiteRun.disabled = disabled;

    benchmarkRecord.disabled = disabled;

    rendererSelect.disabled = disabled;

    setScenarioControlsDisabled(disabled);

    suiteAddSetup.disabled = disabled;

    benchmarkConfigRun.disabled = disabled;
}

async function startBenchmarkSuite(config: BenchmarkSuiteConfig): Promise<void> {
    if (
        benchmarkSuiteRunning ||
        benchmarkMonitor.isRecording() ||
        restartInProgress ||
        rendererOperationInProgress
    ) {
        return;
    }

    const originalRows = gridConfig.rows;
    const originalColumns = gridConfig.columns;
    const originalVehicleCount = vehiclesConfig.count;
    const originalRendererType = activeRendererType;
    const originalSeed = currentSimulationSeed;

    benchmarkSuiteRunning = true;

    setBenchmarkSuiteControlsDisabled(true);

    latestSnapshot = null;

    renderSnapshot(null);

    benchmarkSuiteResults = [];

    const totalRuns = getBenchmarkSuiteTotalRuns(config);

    try {
        benchmarkStatus.textContent = `Suite starting • 1/${totalRuns}`;

        benchmarkSuiteResults = await benchmarkSuiteRunner.run(config, {
            onProgress: ({
                completedRuns,
                totalRuns: progressTotalRuns,
                setup,
                renderer,
                phase,
            }) => {
                let phaseLabel = 'Recording';

                if (phase === 'reset') {
                    phaseLabel = 'Resetting';
                } else if (phase === 'warmup') {
                    phaseLabel = 'Warming up';
                }

                const currentRun = Math.min(completedRuns + 1, progressTotalRuns);

                benchmarkStatus.textContent = `${phaseLabel} • ${setup.name} • ${getRendererLabel(renderer)} • ${currentRun}/${progressTotalRuns}`;
            },
        });
    } catch (error) {
        console.error('Benchmark suite failed.', error);
    } finally {
        benchmarkStatus.textContent = 'Restoring scenario…';

        try {
            currentSimulationSeed = originalSeed;

            await rebuildSimulation(originalRows, originalColumns, originalVehicleCount, {
                force: true,
                updateInputs: true,
            });

            await switchRendererInternal(originalRendererType);
        } catch (error) {
            console.error('Could not restore scenario after benchmark suite.', error);
        }

        benchmarkSuiteRunning = false;

        setBenchmarkSuiteControlsDisabled(false);

        benchmarkStatus.textContent = 'Complete';

        renderBenchmarkCurrent(performance.now());

        renderBenchmarkResults(benchmarkSuiteResults);

        openBenchmarkResultsModal();
    }
}

/* =============================================================
   STANDARD SUITE
============================================================= */

benchmarkSuiteRun.addEventListener('click', () => {
    if (
        benchmarkSuiteRunning ||
        benchmarkMonitor.isRecording() ||
        restartInProgress ||
        rendererOperationInProgress
    ) {
        return;
    }

    void startBenchmarkSuite(standardBenchmarkSuite);
});

/* =============================================================
   CUSTOM SUITE
============================================================= */

benchmarkConfigRun.addEventListener('click', () => {
    if (benchmarkSuiteRunning) {
        return;
    }

    let config: BenchmarkSuiteConfig;

    try {
        config = readBenchmarkSuiteConfigFromUi();
    } catch (error) {
        console.error('Invalid custom benchmark suite configuration.', error);

        window.alert(error instanceof Error ? error.message : String(error));

        return;
    }

    config.seed = generateRandomSeed();

    customBenchmarkSuiteConfig = config;

    closeBenchmarkConfigModal();

    void startBenchmarkSuite(config);
});

/* =============================================================
   BENCHMARK RESULTS MODAL
============================================================= */

function openBenchmarkResultsModal(): void {
    benchmarkResultsModal.hidden = false;
}

function closeBenchmarkResultsModal(): void {
    benchmarkResultsModal.hidden = true;
}

benchmarkResultsClose.addEventListener('click', closeBenchmarkResultsModal);

benchmarkResultsFooterClose.addEventListener('click', closeBenchmarkResultsModal);

benchmarkResultsCopy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(JSON.stringify(benchmarkSuiteResults, null, 2));
    } catch {
        console.warn('Could not copy benchmark suite results.');
    }
});

function renderBenchmarkResults(results: BenchmarkSuiteRunResult[]): void {
    const completeCount = results.filter((result) => result.status === 'complete').length;

    const skippedCount = results.filter((result) => result.status === 'skipped').length;

    const failedCount = results.filter((result) => result.status === 'failed').length;

    benchmarkResultsSummary.textContent = `${completeCount} complete · ${skippedCount} skipped · ${failedCount} failed`;

    if (results.length === 0) {
        benchmarkResultsContent.innerHTML = `
            <div class="benchmark-empty">
                No benchmark results were produced.
            </div>
        `;

        return;
    }

    const rows = results
        .map((result) => {
            const snapshot = result.snapshot;

            const statusLabel =
                result.status === 'complete'
                    ? 'Complete'
                    : result.status === 'skipped'
                      ? 'Skipped'
                      : 'Failed';

            if (!snapshot) {
                return `
                    <tr>
                        <td>
                            ${escapeHtml(result.setup.name)}
                        </td>
                        <td>
                            ${escapeHtml(getRendererLabel(result.renderer))}
                        </td>
                        <td>
                            <span class="benchmark-result-status is-${result.status}">
                                ${statusLabel}
                            </span>
                        </td>
                        <td colspan="12">
                            ${escapeHtml(result.reason ?? '')}
                        </td>
                    </tr>
                `;
            }

            const memoryDelta =
                snapshot.memoryStartMb !== null && snapshot.memoryEndMb !== null
                    ? `${(snapshot.memoryEndMb - snapshot.memoryStartMb).toFixed(1)} MB`
                    : 'N/A';

            return `
                <tr>
                    <td>
                        ${escapeHtml(result.setup.name)}
                    </td>
                    <td>
                        ${escapeHtml(getRendererLabel(result.renderer))}
                    </td>
                    <td>
                        <span class="benchmark-result-status is-complete">
                            Complete
                        </span>
                    </td>
                    <td>
                        ${snapshot.rows} × ${snapshot.columns}
                    </td>
                    <td>
                        ${snapshot.vehicleCount}
                    </td>
                    <td>
                        ${snapshot.averageFps.toFixed(1)}
                    </td>
                    <td>
                        ${snapshot.low1PercentFps.toFixed(1)}
                    </td>
                    <td>
                        ${snapshot.averageFrameTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${snapshot.p95FrameTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${snapshot.averageSimulationTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${snapshot.p95SimulationTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${snapshot.averageRenderTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${snapshot.averageMainThreadUtilization.toFixed(1)}%
                    </td>
                    <td>
                        ${memoryDelta}
                    </td>
                    <td>
                        ${snapshot.frameCount}
                    </td>
                </tr>
            `;
        })
        .join('');

    benchmarkResultsContent.innerHTML = `
        <div class="benchmark-results-table-wrapper">
            <table class="benchmark-results-table">
                <thead>
                    <tr>
                        <th>Setup</th>
                        <th>Renderer</th>
                        <th>Status</th>
                        <th>Map Size</th>
                        <th>Vehicles</th>
                        <th>Avg FPS</th>
                        <th>1% Low</th>
                        <th>Avg Frame</th>
                        <th>P95 Frame</th>
                        <th>Avg Sim</th>
                        <th>P95 Sim</th>
                        <th>Avg Render</th>
                        <th>Main Thread</th>
                        <th>Memory Δ</th>
                        <th>Frames</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/* =============================================================
   UTILITIES
============================================================= */

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/* =============================================================
   SIMULATION LOOP
============================================================= */

let previousTime = performance.now();

function frame(currentTime: number): void {
    if (restartInProgress || rendererOperationInProgress) {
        previousTime = currentTime;

        requestAnimationFrame(frame);

        return;
    }

    try {
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
    } catch (error) {
        console.error('Simulation frame failed.', error);
    }

    requestAnimationFrame(frame);
}

/* =============================================================
   INITIALIZATION
============================================================= */

webgpuAvailable = await isWebGPUAvailable();

updateWebGPUOption();

/*
 * Start with DOM only.
 *
 * Pixi is initialized only if/when selected.
 */
const domInitialized = await initializeRenderer('dom');

if (!domInitialized) {
    throw new Error('Failed to initialize the DOM renderer.');
}

activeRendererType = 'dom';

activeRenderer = renderers.dom;

rendererSelect.value = 'dom';

showRendererHost('dom');

benchmarkMonitor.resetLiveMetrics('dom', simulation.getVehicles().length);

renderCurrentState();

renderSnapshot(latestSnapshot);

renderSuiteRendererOptions();

renderSuiteSetups();

previousTime = performance.now();

requestAnimationFrame(frame);
