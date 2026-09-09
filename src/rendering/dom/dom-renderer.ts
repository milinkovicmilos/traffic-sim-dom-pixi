import type { Road } from '@core/map/road';
import type { RoadMap } from '@core/map/road-map';
import type { VehicleState } from '@core/vehicles/vehicle-state';

import type { Renderer, RenderState, TrafficLightRenderState } from '@rendering/renderer';

export interface DOMRendererOptions {
    container: HTMLElement;

    /**
     * Spacing inside the scene around the simulation.
     */
    padding: number;

    roadWidth: number;

    vehicleLength: number;
    vehicleWidth: number;
}

interface TrafficLightElements {
    root: HTMLDivElement;

    red: HTMLDivElement;
    yellow: HTMLDivElement;
    green: HTMLDivElement;

    timer: HTMLDivElement;
}

export class DOMRenderer implements Renderer {
    private readonly container: HTMLElement;

    private readonly padding: number;

    private readonly roadWidth: number;

    private readonly vehicleLength: number;
    private readonly vehicleWidth: number;

    private scene!: HTMLDivElement;

    private roadsLayer!: HTMLDivElement;
    private lanesLayer!: HTMLDivElement;
    private trafficLightsLayer!: HTMLDivElement;
    private vehiclesLayer!: HTMLDivElement;

    private readonly trafficLightElements = new Map<string, TrafficLightElements>();

    private readonly vehicleElements = new Map<number, HTMLDivElement>();

    private initialized = false;
    private mapInitialized = false;

    constructor(options: DOMRendererOptions) {
        this.container = options.container;

        this.padding = options.padding;

        this.roadWidth = options.roadWidth;

        this.vehicleLength = options.vehicleLength;

        this.vehicleWidth = options.vehicleWidth;
    }

    initialize(): void {
        if (this.initialized) {
            return;
        }

        this.scene = this.createElement('scene');

        this.roadsLayer = this.createLayer('roads-layer');

        this.lanesLayer = this.createLayer('lanes-layer');

        this.trafficLightsLayer = this.createLayer('traffic-lights-layer');

        this.vehiclesLayer = this.createLayer('vehicles-layer');

        this.scene.append(
            this.roadsLayer,
            this.lanesLayer,
            this.trafficLightsLayer,
            this.vehiclesLayer,
        );

        this.container.replaceChildren(this.scene);

        this.initialized = true;
    }

    render(state: RenderState): void {
        if (!this.initialized) {
            this.initialize();
        }

        if (!this.mapInitialized) {
            this.renderMap(state.roadMap);

            this.createTrafficLights(state.trafficLights);

            this.mapInitialized = true;
        }

        this.updateTrafficLights(state.trafficLights);

        this.updateVehicles(state.vehicles);
    }

    destroy(): void {
        this.vehicleElements.clear();

        this.trafficLightElements.clear();

        this.container.replaceChildren();

        this.initialized = false;
        this.mapInitialized = false;
    }

    /* =========================================================
       COORDINATE OFFSET
    ========================================================= */

    /**
     * Converts a simulation X coordinate into a rendered
     * scene X coordinate.
     */
    private offsetX(x: number): number {
        return x + this.padding;
    }

    /**
     * Converts a simulation Y coordinate into a rendered
     * scene Y coordinate.
     */
    private offsetY(y: number): number {
        return y + this.padding;
    }

    /* =========================================================
       MAP
    ========================================================= */

    private renderMap(roadMap: RoadMap): void {
        this.roadsLayer.replaceChildren();

        this.lanesLayer.replaceChildren();

        for (const road of roadMap.getRoads()) {
            this.renderRoad(road);

            this.renderLaneDivider(road);
        }
    }

    private renderRoad(road: Road): void {
        const start = road.getNodeA().getPosition();

        const end = road.getNodeB().getPosition();

        const dx = end.x - start.x;

        const dy = end.y - start.y;

        const centerLength = Math.sqrt(dx * dx + dy * dy);

        if (centerLength === 0) {
            return;
        }

        const rotation = Math.atan2(dy, dx);

        /*
         * Extend the road beneath the intersection so that
         * the roads on the edge of the map appear connected.
         *
         * This is road geometry and is independent from
         * the scene padding.
         */
        const extension = this.roadWidth / 2;

        const startX = start.x - Math.cos(rotation) * extension;

        const startY = start.y - Math.sin(rotation) * extension;

        const length = centerLength + extension * 2;

        const roadElement = this.createElement('road');

        roadElement.style.left = `${this.offsetX(startX)}px`;

        roadElement.style.top = `${this.offsetY(startY)}px`;

        roadElement.style.width = `${length}px`;

        roadElement.style.height = `${this.roadWidth}px`;

        roadElement.style.transform = `translateY(-50%) ` + `rotate(${rotation}rad)`;

        this.roadsLayer.appendChild(roadElement);
    }

    /**
     * Draw exactly one divider for each physical two-way road.
     *
     * The actual two lane centerlines are represented by Lane
     * geometry and are not separately drawn.
     */
    private renderLaneDivider(road: Road): void {
        const start = road.getNodeA().getPosition();

        const end = road.getNodeB().getPosition();

        const dx = end.x - start.x;

        const dy = end.y - start.y;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const rotation = Math.atan2(dy, dx);

        const divider = this.createElement('lane-divider');

        divider.style.left = `${this.offsetX(start.x)}px`;

        divider.style.top = `${this.offsetY(start.y)}px`;

        divider.style.width = `${length}px`;

        divider.style.transform = `translateY(-50%) ` + `rotate(${rotation}rad)`;

        this.lanesLayer.appendChild(divider);
    }

    /* =========================================================
       TRAFFIC LIGHTS
    ========================================================= */

    private createTrafficLights(states: readonly TrafficLightRenderState[]): void {
        this.trafficLightsLayer.replaceChildren();

        this.trafficLightElements.clear();

        for (const state of states) {
            const elements = this.createTrafficLight(state);

            this.trafficLightElements.set(state.key, elements);
        }
    }

    private createTrafficLight(state: TrafficLightRenderState): TrafficLightElements {
        const root = this.createElement('traffic-light');

        root.style.left = `${this.offsetX(state.position.x)}px`;

        root.style.top = `${this.offsetY(state.position.y)}px`;

        const red = this.createElement('traffic-light-lamp');

        red.classList.add('traffic-light-lamp-red');

        const yellow = this.createElement('traffic-light-lamp');

        yellow.classList.add('traffic-light-lamp-yellow');

        const green = this.createElement('traffic-light-lamp');

        green.classList.add('traffic-light-lamp-green');

        const timer = this.createElement('traffic-light-timer');

        root.append(red, yellow, green, timer);

        this.trafficLightsLayer.appendChild(root);

        return {
            root,
            red,
            yellow,
            green,
            timer,
        };
    }

    private updateTrafficLights(states: readonly TrafficLightRenderState[]): void {
        for (const state of states) {
            const elements = this.trafficLightElements.get(state.key);

            if (!elements) {
                continue;
            }

            elements.red.classList.toggle('is-active', state.color === 'red');

            elements.yellow.classList.toggle('is-active', state.color === 'yellow');

            elements.green.classList.toggle('is-active', state.color === 'green');

            elements.timer.textContent = `${(state.remainingTime / 1000).toFixed(1)}s`;
        }
    }

    /* =========================================================
       VEHICLES
    ========================================================= */

    private updateVehicles(vehicles: readonly VehicleState[]): void {
        const activeIndexes = new Set<number>();

        vehicles.forEach((vehicle, index) => {
            activeIndexes.add(index);

            let element = this.vehicleElements.get(index);

            if (!element) {
                element = this.createVehicle();

                this.vehicleElements.set(index, element);

                this.vehiclesLayer.appendChild(element);
            }

            /*
             * The vehicle remains in simulation coordinates.
             *
             * Padding is applied exactly once here to get
             * the rendered scene coordinate.
             */
            element.style.transform =
                `translate3d(` +
                `${this.offsetX(vehicle.position.x)}px, ` +
                `${this.offsetY(vehicle.position.y)}px, 0) ` +
                `translate(-50%, -50%) ` +
                `rotate(${vehicle.angle}rad)`;
        });

        for (const [index, element] of this.vehicleElements) {
            if (activeIndexes.has(index)) {
                continue;
            }

            element.remove();

            this.vehicleElements.delete(index);
        }
    }

    private createVehicle(): HTMLDivElement {
        const element = this.createElement('vehicle');

        element.style.width = `${this.vehicleLength}px`;

        element.style.height = `${this.vehicleWidth}px`;

        return element;
    }

    /* =========================================================
       DOM HELPERS
    ========================================================= */

    private createLayer(className: string): HTMLDivElement {
        const element = this.createElement(className);

        element.style.position = 'absolute';

        element.style.inset = '0';

        return element;
    }

    private createElement(className: string): HTMLDivElement {
        const element = document.createElement('div');

        element.className = className;

        return element;
    }
}
