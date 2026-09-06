import type { Road } from '@core/map/road';
import type { RoadMap } from '@core/map/road-map';
import type { VehicleState } from '@core/vehicles/vehicle-state';

import type { Renderer, RenderState, TrafficLightRenderState } from '@rendering/renderer';

export interface DOMRendererOptions {
    container: HTMLElement;

    width: number;
    height: number;

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

    private readonly width: number;
    private readonly height: number;

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

        this.width = options.width;
        this.height = options.height;

        this.roadWidth = options.roadWidth;

        this.vehicleLength = options.vehicleLength;
        this.vehicleWidth = options.vehicleWidth;
    }

    initialize(): void {
        if (this.initialized) {
            return;
        }

        this.scene = this.createElement('traffic-scene');

        this.scene.style.width = `${this.width}px`;

        this.scene.style.height = `${this.height}px`;

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

        const rotation = Math.atan2(dy, dx);

        /*
         * Extend every road underneath the neighboring
         * intersection/road by half its width.
         *
         * This prevents visible gaps where roads meet.
         */
        const extension = this.roadWidth / 2;

        const startX = start.x - Math.cos(rotation) * extension;

        const startY = start.y - Math.sin(rotation) * extension;

        const length = centerLength + extension * 2;

        const roadElement = this.createElement('road');

        roadElement.style.left = `${startX}px`;

        roadElement.style.top = `${startY}px`;

        roadElement.style.width = `${length}px`;

        roadElement.style.height = `${this.roadWidth}px`;

        roadElement.style.transform = `translateY(-50%) ` + `rotate(${rotation}rad)`;

        this.roadsLayer.appendChild(roadElement);
    }

    /**
     * Exactly one visual divider for a two-way road.
     *
     * This is not lane geometry. Cars use the Lane domain
     * geometry for their actual positions.
     */
    private renderLaneDivider(road: Road): void {
        const start = road.getNodeA().getPosition();

        const end = road.getNodeB().getPosition();

        const dx = end.x - start.x;

        const dy = end.y - start.y;

        const length = Math.sqrt(dx * dx + dy * dy);

        const rotation = Math.atan2(dy, dx);

        const divider = this.createElement('lane-divider');

        divider.style.left = `${start.x}px`;

        divider.style.top = `${start.y}px`;

        divider.style.width = `${length}px`;

        divider.style.transform = `translateY(-50%) ` + `rotate(${rotation}rad)`;

        this.lanesLayer.appendChild(divider);
    }

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

        root.style.left = `${state.position.x}px`;

        root.style.top = `${state.position.y}px`;

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

            this.updateVehicle(element, vehicle);
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

        /*
         * VehicleConfig.length is the front-to-back
         * dimension of the car.
         *
         * VehicleConfig.width is the side-to-side
         * dimension.
         *
         * CSS width therefore gets LENGTH and CSS height
         * gets WIDTH.
         */
        element.style.width = `${this.vehicleLength}px`;

        element.style.height = `${this.vehicleWidth}px`;

        return element;
    }

    private updateVehicle(element: HTMLDivElement, vehicle: VehicleState): void {
        element.style.transform =
            `translate3d(` +
            `${vehicle.position.x}px, ` +
            `${vehicle.position.y}px, 0) ` +
            `translate(-50%, -50%) ` +
            `rotate(${vehicle.angle}rad)`;
    }

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
