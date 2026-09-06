import './style.css';

import { Simulation } from '@core/simulation/simulation';

import type { GridConfig } from '@shared/config/grid-config';
import type { SimulationConfig } from '@shared/config/simulation-config';
import type { TrafficLightPhaseConfig } from '@shared/config/traffic-light-phase-config';
import type { VehicleConfig } from '@shared/config/vehicle-config';

import { createRenderer, type RendererType } from '@rendering/renderer-factory';

import type { Renderer } from '@rendering/renderer';

import { createRenderState } from '@rendering/render-state';

/* =============================================================
   CONFIG
============================================================= */

const gridConfig: GridConfig = {
    rows: 5,
    columns: 5,
    blockSize: 250,
    roadWidth: 30,
    laneWidth: 15,
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

const simulationWidth = gridConfig.columns * gridConfig.blockSize;

const simulationHeight = gridConfig.rows * gridConfig.blockSize;

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

                <option value="pixi">
                    PixiJS
                </option>
            </select>
        </label>
    </div>

    <div
        id="simulation-root"
        class="simulation-scroll"
    >
        <div
            id="simulation-content"
            class="simulation-content"
        ></div>
    </div>
`;

const simulationRoot = document.querySelector<HTMLElement>('#simulation-content');

const rendererSelect = document.querySelector<HTMLSelectElement>('#renderer-select');

if (!simulationRoot || !rendererSelect) {
    throw new Error('Failed to initialize application UI.');
}

/* =============================================================
   SIMULATION
============================================================= */

const simulation = new Simulation(simulationConfig);

/*
 * The simulation is created once.
 *
 * Renderer switching never recreates it.
 */
const rendererOptions = {
    dom: {
        container: simulationRoot,

        width: simulationWidth,

        height: simulationHeight,

        roadWidth: gridConfig.roadWidth,

        vehicleLength: vehiclesConfig.length,

        vehicleWidth: vehiclesConfig.width,
    },

    pixi: {
        container: simulationRoot,

        width: simulationWidth,

        height: simulationHeight,

        roadWidth: gridConfig.roadWidth,

        vehicleLength: vehiclesConfig.length,

        vehicleWidth: vehiclesConfig.width,
    },
};

let renderer: Renderer = createRenderer('dom', rendererOptions);

await renderer.initialize();

renderer.render(createRenderState(simulation));

/* =============================================================
   RENDERER SWITCHING
============================================================= */

let rendererSwitchVersion = 0;

rendererSelect.addEventListener('change', async () => {
    const type = rendererSelect.value as RendererType;

    const version = ++rendererSwitchVersion;

    renderer.destroy();

    const nextRenderer = createRenderer(type, rendererOptions);

    await nextRenderer.initialize();

    /*
     * Protect against a second renderer switch
     * occurring during async Pixi initialization.
     */
    if (version !== rendererSwitchVersion) {
        nextRenderer.destroy();

        return;
    }

    renderer = nextRenderer;

    renderer.render(createRenderState(simulation));
});

/* =============================================================
   SIMULATION LOOP
============================================================= */

let previousTime = performance.now();

function frame(currentTime: number): void {
    /*
     * Prevent a suspended/backgrounded tab from
     * producing a huge simulation step.
     */
    const deltaTime = Math.min(currentTime - previousTime, 100);

    previousTime = currentTime;

    simulation.update(deltaTime);

    renderer.render(createRenderState(simulation));

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
