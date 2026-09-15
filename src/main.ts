import './style.css';

import { Simulation } from '@core/simulation/simulation';
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
import type { RendererType } from '@rendering/renderer-factory';

import {
    renderApp,
    BenchmarkUi,
    closeModal,
    getInput,
    getRendererLabel,
    openModal,
    renderSuiteRendererOptions,
    renderSuiteSetups,
} from './ui/ui';

import type { GridConfig } from '@shared/config/grid-config';
import type { SimulationConfig } from '@shared/config/simulation-config';
import type { TrafficLightPhaseConfig } from '@shared/config/traffic-light-phase-config';
import type { VehicleConfig } from '@shared/config/vehicle-config';

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
        grid: { ...gridConfig },
        trafficLightsPhase: { ...trafficLightsPhaseConfig },
        vehicles: { ...vehiclesConfig },
        seed: currentSimulationSeed,
    };
}

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

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
    throw new Error('Could not find #app.');
}

const elements = renderApp(app, gridConfig.rows, gridConfig.columns, vehiclesConfig.count);

const rendererHosts: Record<RendererType, HTMLDivElement> = {
    dom: elements.domRendererHost,
    'pixi-webgl': elements.pixiWebglRendererHost,
    'pixi-webgpu': elements.pixiWebgpuRendererHost,
};

for (const host of Object.values(rendererHosts)) {
    host.style.position = 'absolute';
    host.style.inset = '0';
    host.style.display = 'none';
}

const benchmarkMonitor = new BenchmarkMonitor();
const benchmarkUi = new BenchmarkUi(elements, () => benchmarkMonitor.getEnvironment());

let simulation = new Simulation(createSimulationConfig());
let latestSnapshot: BenchmarkSnapshot | null = null;
let benchmarkSuiteResults: BenchmarkSuiteRunResult[] = [];
let benchmarkSuiteRunning = false;
let rendererOperationInProgress = false;
let restartInProgress = false;
let previousTime = performance.now();

interface RendererWithGpuTiming {
    beginGpuTiming?(): void;
    endGpuTiming?(): void;
    consumeGpuTime?(): number | null;
    resetGpuTiming?(): void;
}

import { createRenderer, type RendererOptions } from '@rendering/renderer-factory';
import { createRenderState } from '@rendering/render-state';
import type { Renderer } from '@rendering/renderer';

const rendererOptions: RendererOptions = {
    dom: {
        container: elements.domRendererHost,
        padding: gridConfig.padding,
        roadWidth: gridConfig.roadWidth,
        vehicleLength: vehiclesConfig.length,
        vehicleWidth: vehiclesConfig.width,
    },
    pixiWebgl: {
        container: elements.pixiWebglRendererHost,
        padding: gridConfig.padding,
        roadWidth: gridConfig.roadWidth,
        vehicleLength: vehiclesConfig.length,
        vehicleWidth: vehiclesConfig.width,
        preference: 'webgl',
    },
    pixiWebgpu: {
        container: elements.pixiWebgpuRendererHost,
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
let activeRenderer = renderers.dom;
const initializedRenderers = new Set<RendererType>();

let webgpuAvailable = false;

function getActiveGpuRenderer(): RendererWithGpuTiming {
    return activeRenderer as RendererWithGpuTiming;
}

function showRendererHost(type: RendererType): void {
    for (const rendererType of Object.keys(rendererHosts) as RendererType[]) {
        rendererHosts[rendererType].style.display = rendererType === type ? 'block' : 'none';
    }
}

function isRendererAvailable(type: RendererType): boolean {
    return type !== 'pixi-webgpu' || webgpuAvailable;
}

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
        return (await gpu.requestAdapter()) !== null;
    } catch {
        return false;
    }
}

function updateWebGPUOption(): void {
    const option = elements.rendererSelect.querySelector<HTMLOptionElement>(
        'option[value="pixi-webgpu"]',
    );

    if (!option) {
        return;
    }

    option.disabled = !webgpuAvailable;
    option.textContent = webgpuAvailable ? 'PixiJS WebGPU' : 'PixiJS WebGPU (Unavailable)';

    renderSuiteRendererOptions(
        elements.suiteRendererOptions,
        customBenchmarkSuiteConfig,
        isRendererAvailable,
    );
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

async function switchRendererInternal(type: RendererType): Promise<boolean> {
    if (type === activeRendererType) {
        showRendererHost(activeRendererType);

        if (initializedRenderers.has(activeRendererType)) {
            activeRenderer.render(createRenderState(simulation));
        }

        return true;
    }

    if (!isRendererAvailable(type)) {
        elements.rendererSelect.value = activeRendererType;
        return false;
    }

    rendererOperationInProgress = true;

    try {
        const initialized = await initializeRenderer(type);

        if (!initialized) {
            elements.rendererSelect.value = activeRendererType;
            return false;
        }

        activeRendererType = type;
        activeRenderer = renderers[type];
        elements.rendererSelect.value = activeRendererType;

        showRendererHost(activeRendererType);

        if (!benchmarkMonitor.isRecording()) {
            benchmarkMonitor.resetLiveMetrics(activeRendererType, simulation.getVehicles().length);
        }

        activeRenderer.render(createRenderState(simulation));

        benchmarkUi.renderCurrent(
            performance.now(),
            activeRendererType,
            benchmarkMonitor.getCurrentMetrics(),
        );

        return true;
    } finally {
        rendererOperationInProgress = false;
    }
}

async function switchRenderer(type: RendererType): Promise<void> {
    if (
        restartInProgress ||
        rendererOperationInProgress ||
        benchmarkSuiteRunning ||
        benchmarkMonitor.isRecording()
    ) {
        elements.rendererSelect.value = activeRendererType;
        return;
    }

    await switchRendererInternal(type);
}

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
            elements.rowsInput.value = String(nextRows);
            elements.columnsInput.value = String(nextColumns);
            elements.vehiclesInput.value = String(nextVehicleCount);
        }

        simulation = new Simulation(createSimulationConfig());

        const rendererType = activeRendererType;

        activeRenderer.destroy();
        initializedRenderers.delete(rendererType);

        const initialized = await initializeRenderer(rendererType);

        if (!initialized) {
            throw new Error(`Failed to reinitialize ${getRendererLabel(rendererType)}.`);
        }

        benchmarkMonitor.resetLiveMetrics(activeRendererType, simulation.getVehicles().length);

        showRendererHost(activeRendererType);

        activeRenderer.render(createRenderState(simulation));
    } finally {
        restartInProgress = false;
        previousTime = performance.now();
    }
}

function parseScenarioInteger(input: HTMLInputElement, label: string, minimum: number): number {
    const value = Number.parseInt(input.value, 10);

    if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
    }

    return value;
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

    try {
        const nextRows = parseScenarioInteger(elements.rowsInput, 'Rows', 2);
        const nextColumns = parseScenarioInteger(elements.columnsInput, 'Columns', 2);
        const nextVehicleCount = parseScenarioInteger(elements.vehiclesInput, 'Vehicles', 1);

        await rebuildSimulation(nextRows, nextColumns, nextVehicleCount, {
            force: false,
            updateInputs: true,
        });

        latestSnapshot = null;
        benchmarkUi.renderSnapshot(null);
        elements.benchmarkStatus.textContent = 'Live';
    } catch (error) {
        console.error('Could not restart simulation.', error);

        elements.rowsInput.value = String(gridConfig.rows);
        elements.columnsInput.value = String(gridConfig.columns);
        elements.vehiclesInput.value = String(vehiclesConfig.count);
    }
}

function setScenarioControlsDisabled(disabled: boolean): void {
    elements.rowsInput.disabled = disabled;
    elements.columnsInput.disabled = disabled;
    elements.vehiclesInput.disabled = disabled;
}

function setBenchmarkSuiteControlsDisabled(disabled: boolean): void {
    elements.benchmarkConfigure.disabled = disabled;
    elements.benchmarkSuiteRun.disabled = disabled;
    elements.benchmarkRecord.disabled = disabled;
    elements.rendererSelect.disabled = disabled;
    setScenarioControlsDisabled(disabled);
    elements.suiteAddSetup.disabled = disabled;
    elements.benchmarkConfigRun.disabled = disabled;
}

function getBenchmarkSuiteTotalRuns(suite: BenchmarkSuiteConfig): number {
    return suite.setups.length * suite.renderers.length;
}

function parseIntegerValue(input: HTMLInputElement, label: string, minimum: number): number {
    const value = Number.parseInt(input.value, 10);

    if (!Number.isInteger(value) || value < minimum) {
        throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
    }

    return value;
}

function readBenchmarkSetupsFromUi(): BenchmarkSuiteSetup[] {
    const setupRows = Array.from(
        elements.suiteSetups.querySelectorAll<HTMLElement>('.benchmark-setup-row'),
    );

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

        return {
            id,
            name,
            rows: parseIntegerValue(rowsInput, `Rows for ${name}`, 2),
            columns: parseIntegerValue(columnsInput, `Columns for ${name}`, 2),
            vehicleCount: parseIntegerValue(vehicleCountInput, `Vehicles for ${name}`, 1),
        };
    });
}

function readBenchmarkSuiteConfigFromUi(): BenchmarkSuiteConfig {
    const warmupMs = parseIntegerValue(elements.suiteWarmupInput, 'Warmup duration', 0);
    const durationMs = parseIntegerValue(elements.suiteDurationInput, 'Recording duration', 1);

    const renderers = Array.from(
        elements.suiteRendererOptions.querySelectorAll<HTMLInputElement>(
            'input[data-suite-renderer]:checked',
        ),
    ).map((input) => input.dataset.suiteRenderer as RendererType);

    if (renderers.length === 0) {
        throw new Error('Select at least one renderer.');
    }

    return {
        seed: currentSimulationSeed,
        warmupMs,
        durationMs,
        renderers,
        setups: readBenchmarkSetupsFromUi(),
    };
}

function refreshSuiteUi(): void {
    renderSuiteRendererOptions(
        elements.suiteRendererOptions,
        customBenchmarkSuiteConfig,
        isRendererAvailable,
    );
    renderSuiteSetups(elements.suiteSetups, customBenchmarkSuiteConfig);
}

function openBenchmarkConfigModal(): void {
    elements.suiteWarmupInput.value = String(customBenchmarkSuiteConfig.warmupMs);
    elements.suiteDurationInput.value = String(customBenchmarkSuiteConfig.durationMs);

    refreshSuiteUi();
    openModal(elements.benchmarkConfigModal);
}

function closeBenchmarkConfigModal(): void {
    closeModal(elements.benchmarkConfigModal);
}

function closeBenchmarkResultsModal(): void {
    closeModal(elements.benchmarkResultsModal);
}

const benchmarkSuiteRunner = new BenchmarkSuiteRunner(benchmarkMonitor, {
    prepareRun: async (setup, renderer, seed) => {
        currentSimulationSeed = seed;

        await rebuildSimulation(setup.rows, setup.columns, setup.vehicleCount, {
            force: true,
            updateInputs: true,
        });

        const switched = await switchRendererInternal(renderer);

        if (switched) {
            getActiveGpuRenderer().resetGpuTiming?.();
        }

        return switched;
    },
    getVehicleCount: () => simulation.getVehicles().length,
});

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
    benchmarkUi.renderSnapshot(null);
    benchmarkSuiteResults = [];

    const totalRuns = getBenchmarkSuiteTotalRuns(config);

    try {
        elements.benchmarkStatus.textContent = `Suite starting • 1/${totalRuns}`;

        benchmarkSuiteResults = await benchmarkSuiteRunner.run(config, {
            onProgress: ({
                completedRuns,
                totalRuns: progressTotalRuns,
                setup,
                renderer,
                phase,
            }) => {
                const phaseLabel =
                    phase === 'reset'
                        ? 'Resetting'
                        : phase === 'warmup'
                          ? 'Warming up'
                          : 'Recording';

                const currentRun = Math.min(completedRuns + 1, progressTotalRuns);

                elements.benchmarkStatus.textContent = `${phaseLabel} • ${setup.name} • ${getRendererLabel(renderer)} • ${currentRun}/${progressTotalRuns}`;
            },
        });
    } catch (error) {
        console.error('Benchmark suite failed.', error);
    } finally {
        elements.benchmarkStatus.textContent = 'Restoring scenario…';

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

        elements.benchmarkStatus.textContent = 'Complete';

        benchmarkUi.renderCurrent(
            performance.now(),
            activeRendererType,
            benchmarkMonitor.getCurrentMetrics(),
        );

        benchmarkUi.renderResults(benchmarkSuiteResults);
        openModal(elements.benchmarkResultsModal);
    }
}

elements.rendererSelect.addEventListener('change', () => {
    void switchRenderer(elements.rendererSelect.value as RendererType);
});

for (const input of [elements.rowsInput, elements.columnsInput, elements.vehiclesInput]) {
    input.addEventListener('change', () => {
        void restartSimulation();
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            input.blur();
        }
    });
}

elements.benchmarkRecord.addEventListener('click', () => {
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

        elements.benchmarkStatus.textContent = 'Complete';
        elements.benchmarkRecord.textContent = 'Record Snapshot';
        elements.rendererSelect.disabled = false;
        setScenarioControlsDisabled(false);
        elements.benchmarkSuiteRun.disabled = false;
        elements.benchmarkConfigure.disabled = false;

        benchmarkUi.renderSnapshot(latestSnapshot);

        return;
    }

    getActiveGpuRenderer().resetGpuTiming?.();
    benchmarkMonitor.startRecording(activeRendererType);

    elements.benchmarkStatus.textContent = 'Recording…';
    elements.benchmarkRecord.textContent = 'Stop Recording';
    elements.rendererSelect.disabled = true;
    setScenarioControlsDisabled(true);
    elements.benchmarkSuiteRun.disabled = true;
    elements.benchmarkConfigure.disabled = true;
});

elements.benchmarkConfigure.addEventListener('click', openBenchmarkConfigModal);

elements.benchmarkConfigClose.addEventListener('click', closeBenchmarkConfigModal);

elements.benchmarkConfigCancel.addEventListener('click', closeBenchmarkConfigModal);

elements.benchmarkResultsClose.addEventListener('click', closeBenchmarkResultsModal);

elements.benchmarkResultsFooterClose.addEventListener('click', closeBenchmarkResultsModal);

elements.benchmarkResultsCopy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(JSON.stringify(benchmarkSuiteResults, null, 2));
    } catch {
        console.warn('Could not copy benchmark suite results.');
    }
});

elements.suiteAddSetup.addEventListener('click', () => {
    try {
        const setups = readBenchmarkSetupsFromUi();
        const index = setups.length + 1;

        setups.push({
            id: `setup-${Date.now()}-${index}`,
            name: `Setup ${index}`,
            rows: gridConfig.rows,
            columns: gridConfig.columns,
            vehicleCount: vehiclesConfig.count,
        });

        customBenchmarkSuiteConfig = {
            ...customBenchmarkSuiteConfig,
            setups,
        };

        renderSuiteSetups(elements.suiteSetups, customBenchmarkSuiteConfig);
    } catch (error) {
        console.error('Could not add benchmark setup.', error);
        window.alert(error instanceof Error ? error.message : String(error));
    }
});

elements.suiteSetups.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const setupId = target.dataset.removeSetup;

    if (!setupId || customBenchmarkSuiteConfig.setups.length <= 1) {
        return;
    }

    try {
        const setups = readBenchmarkSetupsFromUi().filter((setup) => setup.id !== setupId);

        customBenchmarkSuiteConfig = {
            ...customBenchmarkSuiteConfig,
            setups,
        };

        renderSuiteSetups(elements.suiteSetups, customBenchmarkSuiteConfig);
    } catch (error) {
        console.error('Could not remove benchmark setup.', error);
        window.alert(error instanceof Error ? error.message : String(error));
    }
});

elements.benchmarkSuiteRun.addEventListener('click', () => {
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

elements.benchmarkConfigRun.addEventListener('click', () => {
    if (benchmarkSuiteRunning) {
        return;
    }

    try {
        const config = readBenchmarkSuiteConfigFromUi();

        config.seed = generateRandomSeed();
        customBenchmarkSuiteConfig = config;

        closeBenchmarkConfigModal();
        void startBenchmarkSuite(config);
    } catch (error) {
        console.error('Invalid custom benchmark suite configuration.', error);

        window.alert(error instanceof Error ? error.message : String(error));
    }
});

for (const backdrop of document.querySelectorAll<HTMLElement>('[data-close-modal]')) {
    backdrop.addEventListener('click', () => {
        switch (backdrop.dataset.closeModal) {
            case 'benchmark-config-modal':
                closeBenchmarkConfigModal();
                break;
            case 'benchmark-results-modal':
                closeBenchmarkResultsModal();
                break;
        }
    });
}

async function start(): Promise<void> {
    webgpuAvailable = await isWebGPUAvailable();
    updateWebGPUOption();

    if (!(await initializeRenderer('dom'))) {
        throw new Error('Failed to initialize the DOM renderer.');
    }

    activeRendererType = 'dom';
    activeRenderer = renderers.dom;
    elements.rendererSelect.value = 'dom';

    showRendererHost('dom');

    benchmarkMonitor.resetLiveMetrics('dom', simulation.getVehicles().length);

    activeRenderer.render(createRenderState(simulation));
    benchmarkUi.renderSnapshot(latestSnapshot);
    refreshSuiteUi();

    previousTime = performance.now();
    requestAnimationFrame(frame);
}

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

        const renderStart = performance.now();
        const gpuRenderer = getActiveGpuRenderer();

        gpuRenderer.beginGpuTiming?.();

        try {
            void renderCurrentState();
        } finally {
            gpuRenderer.endGpuTiming?.();
        }

        const renderTime = performance.now() - renderStart;
        const gpuTime = gpuRenderer.consumeGpuTime?.() ?? null;

        if (gpuTime !== null) {
            benchmarkMonitor.recordGpuTime(gpuTime);
        }

        const frameTime = performance.now() - frameStart;

        benchmarkMonitor.recordFrame(
            currentTime,
            frameTime,
            simulationTime,
            renderTime,
            simulation.getVehicles().length,
        );

        benchmarkUi.renderCurrent(
            currentTime,
            activeRendererType,
            benchmarkMonitor.getCurrentMetrics(),
        );
    } catch (error) {
        console.error('Simulation frame failed.', error);
    }

    requestAnimationFrame(frame);
}

void start();
