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
    count: 300,
    stoppingDistance: 25,
};

const simulationConfig: SimulationConfig = {
    grid: gridConfig,
    trafficLightsPhase: trafficLightsPhaseConfig,
    vehicles: vehiclesConfig,
    seed: Math.random(),
};

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
    throw new Error('Could not find #app.');
}

app.innerHTML = `
    <div class="simulation-toolbar">
        <h1 class="simulation-title">Traffic Simulation</h1>

        <label class="renderer-selector">
            <span>Renderer</span>

            <select id="renderer-select">
                <option value="dom">DOM</option>
                <option value="pixi">PixiJS</option>
            </select>
        </label>
    </div>

    <div id="simulation-root" class="simulation-scroll">
        <div id="simulation-content" class="simulation-content">
            <div id="dom-renderer-host" class="renderer-host"></div>
            <div id="pixi-renderer-host" class="renderer-host"></div>
        </div>
    </div>
`;

const simulationContent = document.querySelector<HTMLDivElement>('#simulation-content');

const domRendererHost = document.querySelector<HTMLDivElement>('#dom-renderer-host');

const pixiRendererHost = document.querySelector<HTMLDivElement>('#pixi-renderer-host');

const rendererSelect = document.querySelector<HTMLSelectElement>('#renderer-select');

if (!simulationContent || !domRendererHost || !pixiRendererHost || !rendererSelect) {
    throw new Error('Failed to initialize application UI.');
}

simulationContent.style.position = 'relative';

const rendererHosts: Record<RendererType, HTMLDivElement> = {
    dom: domRendererHost,
    pixi: pixiRendererHost,
};

for (const host of Object.values(rendererHosts)) {
    host.style.position = 'absolute';
    host.style.inset = '0';
}

const simulation = new Simulation(simulationConfig);

const rendererOptions: RendererOptions = {
    dom: {
        container: domRendererHost,
        padding: gridConfig.padding,
        roadWidth: gridConfig.roadWidth,
        vehicleLength: vehiclesConfig.length,
        vehicleWidth: vehiclesConfig.width,
    },

    pixi: {
        container: pixiRendererHost,
        padding: gridConfig.padding,
        roadWidth: gridConfig.roadWidth,
        vehicleLength: vehiclesConfig.length,
        vehicleWidth: vehiclesConfig.width,
    },
};

const renderers: Record<RendererType, Renderer> = {
    dom: createRenderer('dom', rendererOptions),
    pixi: createRenderer('pixi', rendererOptions),
};

let activeRendererType: RendererType = 'dom';
let activeRenderer = renderers[activeRendererType];

for (const renderer of Object.values(renderers)) {
    await renderer.initialize();
}

function setActiveRenderer(type: RendererType): void {
    activeRendererType = type;
    activeRenderer = renderers[type];

    for (const rendererType of Object.keys(rendererHosts) as RendererType[]) {
        const host = rendererHosts[rendererType];
        host.style.display = rendererType === activeRendererType ? 'block' : 'none';
    }

    activeRenderer.render(createRenderState(simulation));
}

setActiveRenderer('dom');

rendererSelect.addEventListener('change', () => {
    const type = rendererSelect.value as RendererType;
    setActiveRenderer(type);
});

let previousTime = performance.now();

function frame(currentTime: number): void {
    const deltaTime = Math.min(currentTime - previousTime, 100);
    previousTime = currentTime;

    simulation.update(deltaTime);

    activeRenderer.render(createRenderState(simulation));

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
