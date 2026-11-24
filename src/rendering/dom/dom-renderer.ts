import type { Road } from '@core/map/road';
import type { RoadMap } from '@core/map/road-map';
import type { VehicleState } from '@core/vehicles/vehicle-state';
import type {
    Renderer,
    RenderState,
    StaticElementCounts,
    TrafficLightRenderState,
} from '@rendering/renderer';
import {
    getStaticChunkCell,
    isStaticChunkVisible,
    type CullViewport,
    type StaticChunkBounds,
} from '@rendering/static-chunks';

export interface DOMRendererOptions {
    container: HTMLElement;
    padding: number;
    roadWidth: number;
    vehicleLength: number;
    vehicleWidth: number;
    // Hide static elements outside the viewport by the same chunk rule as the PixiJS renderer.
    culling?: boolean;
}

/*
 * One wrapper element per layer and chunk. Culling sets display: none on the wrappers,
 * which takes their elements out of layout and paint.
 */
interface StaticChunk {
    bounds: StaticChunkBounds;
    roads: HTMLDivElement | null;
    lanes: HTMLDivElement | null;
    trafficLights: HTMLDivElement | null;
    roadCount: number;
    laneDividerCount: number;
    trafficLightCount: number;
    visible: boolean;
}

interface TrafficLightElements {
    root: HTMLDivElement;
    red: HTMLDivElement;
    yellow: HTMLDivElement;
    green: HTMLDivElement;
    timer: HTMLDivElement | null;
    lastColor: TrafficLightRenderState['color'] | null;
    lastTimerText: string;
    // null when culling is off.
    chunk: StaticChunk | null;
}

interface VehicleElement {
    element: HTMLImageElement;
    x: number;
    y: number;
    angle: number;
}

export class DOMRenderer implements Renderer {
    private static readonly VEHICLE_IMAGE_URL = new URL(
        '../../assets/vehicle.webp',
        import.meta.url,
    ).href;

    private readonly container: HTMLElement;
    private readonly padding: number;
    private readonly roadWidth: number;
    private readonly vehicleLength: number;
    private readonly vehicleWidth: number;
    private readonly culling: boolean;

    private scene!: HTMLDivElement;
    private sceneSizer: HTMLDivElement | null = null;
    private roadsLayer!: HTMLDivElement;
    private lanesLayer!: HTMLDivElement;
    private trafficLightsLayer!: HTMLDivElement;
    private vehiclesLayer!: HTMLDivElement;

    private readonly trafficLightElements = new Map<string, TrafficLightElements>();
    private readonly vehicleElements: VehicleElement[] = [];
    private readonly staticChunks = new Map<string, StaticChunk>();

    private roadCount = 0;
    private laneDividerCount = 0;

    private mapMinX = 0;
    private mapMinY = 0;

    // Latest states, used to bring lights up to date when their chunk becomes visible.
    private latestTrafficLights: readonly TrafficLightRenderState[] = [];

    private resizeObserver?: ResizeObserver;

    private initialized = false;

    private renderedRoadMap: RoadMap | null = null;

    private trafficLightTimersVisible = true;
    private trafficLightsStale = false;

    constructor(options: DOMRendererOptions) {
        this.container = options.container;
        this.padding = options.padding;
        this.roadWidth = options.roadWidth;
        this.vehicleLength = options.vehicleLength;
        this.vehicleWidth = options.vehicleWidth;
        this.culling = options.culling ?? false;
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

        if (this.culling) {
            // Hidden chunks leave layout, so they no longer stretch the scroll area.
            // The sizer keeps it at the full scene size.
            this.sceneSizer = this.createElement('scene-sizer');
            this.scene.append(this.sceneSizer);

            this.scene.addEventListener('scroll', this.handleScroll, { passive: true });

            // Also covers the host being shown again after another renderer was active.
            this.resizeObserver = new ResizeObserver(() => {
                this.updateStaticChunkVisibility();
            });
            this.resizeObserver.observe(this.container);
        }

        this.container.replaceChildren(this.scene);
        this.initialized = true;
    }

    render(state: RenderState): void {
        if (!this.initialized) {
            this.initialize();
        }

        // A benchmark setup can replace the simulation's RoadMap while this renderer instance stays alive.
        // Rebuild the static map and traffic-light elements whenever a different RoadMap is received.
        if (state.roadMap !== this.renderedRoadMap) {
            this.renderMap(state.roadMap);
            this.createTrafficLights(state.trafficLights);
            this.renderedRoadMap = state.roadMap;
        } else if (this.trafficLightsStale) {
            this.createTrafficLights(state.trafficLights);
        }

        this.latestTrafficLights = state.trafficLights;
        this.updateTrafficLights(state.trafficLights);
        this.updateVehicles(state.vehicles);
    }

    setTrafficLightTimersVisible(visible: boolean): void {
        if (visible === this.trafficLightTimersVisible) {
            return;
        }

        this.trafficLightTimersVisible = visible;
        this.trafficLightsStale = true;
    }

    getStaticElementCounts(): StaticElementCounts {
        const trafficLights = this.trafficLightElements.size;

        if (!this.culling) {
            return {
                roads: this.roadCount,
                laneDividers: this.laneDividerCount,
                trafficLights,
                visibleRoads: this.roadCount,
                visibleLaneDividers: this.laneDividerCount,
                visibleTrafficLights: trafficLights,
            };
        }

        const counts: StaticElementCounts = {
            roads: this.roadCount,
            laneDividers: this.laneDividerCount,
            trafficLights,
            visibleRoads: 0,
            visibleLaneDividers: 0,
            visibleTrafficLights: 0,
        };

        for (const chunk of this.staticChunks.values()) {
            if (!chunk.visible) {
                continue;
            }

            counts.visibleRoads += chunk.roadCount;
            counts.visibleLaneDividers += chunk.laneDividerCount;
            counts.visibleTrafficLights += chunk.trafficLightCount;
        }

        return counts;
    }

    destroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.scene?.removeEventListener('scroll', this.handleScroll);

        this.vehicleElements.length = 0;
        this.trafficLightElements.clear();
        this.staticChunks.clear();
        this.latestTrafficLights = [];
        this.sceneSizer = null;
        this.roadCount = 0;
        this.laneDividerCount = 0;
        this.container.replaceChildren();
        this.initialized = false;
        this.renderedRoadMap = null;
    }

    // Same scene coordinates as the PixiJS renderer, so chunk keys match.
    private offsetX(x: number): number {
        return x - this.mapMinX + this.padding;
    }

    private offsetY(y: number): number {
        return y - this.mapMinY + this.padding;
    }

    private renderMap(roadMap: RoadMap): void {
        this.roadsLayer.replaceChildren();
        this.lanesLayer.replaceChildren();
        this.staticChunks.clear();
        this.roadCount = 0;
        this.laneDividerCount = 0;

        this.updateMapBounds(roadMap);

        for (const road of roadMap.getRoads()) {
            if (this.renderRoad(road)) {
                this.roadCount += 1;
            }

            if (this.renderLaneDivider(road)) {
                this.laneDividerCount += 1;
            }
        }
    }

    private updateMapBounds(roadMap: RoadMap): void {
        const nodes = roadMap.getNodes();

        if (nodes.length === 0) {
            this.mapMinX = 0;
            this.mapMinY = 0;
            this.updateSceneSizer(1, 1);
            return;
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const node of nodes) {
            const position = node.getPosition();

            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x);
            maxY = Math.max(maxY, position.y);
        }

        this.mapMinX = minX;
        this.mapMinY = minY;
        this.updateSceneSizer(maxX - minX + this.padding * 2, maxY - minY + this.padding * 2);
    }

    private updateSceneSizer(width: number, height: number): void {
        if (!this.sceneSizer) {
            return;
        }

        this.sceneSizer.style.width = `${width}px`;
        this.sceneSizer.style.height = `${height}px`;
    }

    /*
     * Returns the parent for a static element at (x, y) in scene coordinates:
     * the layer itself without culling, otherwise the layer's wrapper for that chunk.
     */
    private getStaticParent(
        layer: 'roads' | 'lanes' | 'trafficLights',
        x: number,
        y: number,
    ): { parent: HTMLDivElement; chunk: StaticChunk | null } {
        if (!this.culling) {
            const parent =
                layer === 'roads'
                    ? this.roadsLayer
                    : layer === 'lanes'
                      ? this.lanesLayer
                      : this.trafficLightsLayer;

            return { parent, chunk: null };
        }

        const { key, bounds } = getStaticChunkCell(x, y);
        let chunk = this.staticChunks.get(key);

        if (!chunk) {
            chunk = {
                bounds,
                roads: null,
                lanes: null,
                trafficLights: null,
                roadCount: 0,
                laneDividerCount: 0,
                trafficLightCount: 0,
                visible: true,
            };
            this.staticChunks.set(key, chunk);
        }

        let parent = chunk[layer];

        if (!parent) {
            parent = this.createLayer('static-chunk');
            parent.dataset.chunk = key;

            if (!chunk.visible) {
                parent.style.display = 'none';
            }

            const layerElement =
                layer === 'roads'
                    ? this.roadsLayer
                    : layer === 'lanes'
                      ? this.lanesLayer
                      : this.trafficLightsLayer;

            layerElement.appendChild(parent);
            chunk[layer] = parent;
        }

        return { parent, chunk };
    }

    // Roads and lane dividers are keyed by the road's midpoint, as in the PixiJS renderer.
    private getRoadParent(
        layer: 'roads' | 'lanes',
        road: Road,
    ): { parent: HTMLDivElement; chunk: StaticChunk | null } {
        const start = road.getNodeA().getPosition();
        const end = road.getNodeB().getPosition();

        return this.getStaticParent(
            layer,
            (this.offsetX(start.x) + this.offsetX(end.x)) / 2,
            (this.offsetY(start.y) + this.offsetY(end.y)) / 2,
        );
    }

    private readonly handleScroll = (): void => {
        this.updateStaticChunkVisibility();
    };

    private getCullViewport(): CullViewport {
        // The host's size, the same viewport the PixiJS renderer culls against.
        return {
            left: this.scene.scrollLeft,
            top: this.scene.scrollTop,
            width: Math.max(1, this.container.clientWidth),
            height: Math.max(1, this.container.clientHeight),
        };
    }

    private updateStaticChunkVisibility(): void {
        if (!this.culling || !this.initialized || this.staticChunks.size === 0) {
            return;
        }

        const viewport = this.getCullViewport();
        let revealed = false;

        for (const chunk of this.staticChunks.values()) {
            const visible = isStaticChunkVisible(chunk.bounds, viewport);

            if (visible === chunk.visible) {
                continue;
            }

            chunk.visible = visible;
            revealed ||= visible;

            const display = visible ? '' : 'none';

            if (chunk.roads) {
                chunk.roads.style.display = display;
            }

            if (chunk.lanes) {
                chunk.lanes.style.display = display;
            }

            if (chunk.trafficLights) {
                chunk.trafficLights.style.display = display;
            }
        }

        // Lights in a revealed chunk still show the state from when they were hidden.
        if (revealed) {
            this.updateTrafficLights(this.latestTrafficLights);
        }
    }

    private renderRoad(road: Road): boolean {
        const start = road.getNodeA().getPosition();
        const end = road.getNodeB().getPosition();
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const centerLength = Math.sqrt(dx * dx + dy * dy);

        if (centerLength === 0) {
            return false;
        }

        const rotation = Math.atan2(dy, dx);
        const extension = this.roadWidth / 2;
        const startX = start.x - Math.cos(rotation) * extension;
        const startY = start.y - Math.sin(rotation) * extension;
        const length = centerLength + extension * 2;
        const roadElement = this.createElement('road');

        roadElement.style.left = `${this.offsetX(startX)}px`;
        roadElement.style.top = `${this.offsetY(startY)}px`;
        roadElement.style.width = `${length}px`;
        roadElement.style.height = `${this.roadWidth}px`;
        roadElement.style.transform = `translateY(-50%) rotate(${rotation}rad)`;

        const { parent, chunk } = this.getRoadParent('roads', road);

        parent.appendChild(roadElement);

        if (chunk) {
            chunk.roadCount += 1;
        }

        return true;
    }

    private renderLaneDivider(road: Road): boolean {
        const start = road.getNodeA().getPosition();
        const end = road.getNodeB().getPosition();
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return false;
        }

        const rotation = Math.atan2(dy, dx);
        const divider = this.createElement('lane-divider');

        divider.style.left = `${this.offsetX(start.x)}px`;
        divider.style.top = `${this.offsetY(start.y)}px`;
        divider.style.width = `${length}px`;
        divider.style.transform = `translateY(-50%) rotate(${rotation}rad)`;

        const { parent, chunk } = this.getRoadParent('lanes', road);

        parent.appendChild(divider);

        if (chunk) {
            chunk.laneDividerCount += 1;
        }

        return true;
    }

    private createTrafficLights(states: readonly TrafficLightRenderState[]): void {
        this.trafficLightsLayer.replaceChildren();
        this.trafficLightElements.clear();
        this.trafficLightsStale = false;

        for (const chunk of this.staticChunks.values()) {
            chunk.trafficLights = null;
            chunk.trafficLightCount = 0;
        }

        for (const state of states) {
            const elements = this.createTrafficLight(state);
            this.trafficLightElements.set(state.key, elements);
        }

        this.updateStaticChunkVisibility();
    }

    private createTrafficLight(state: TrafficLightRenderState): TrafficLightElements {
        const root = this.createElement('traffic-light');
        const x = this.offsetX(state.position.x);
        const y = this.offsetY(state.position.y);

        root.style.left = `${x}px`;
        root.style.top = `${y}px`;

        const red = this.createElement('traffic-light-lamp');
        red.classList.add('traffic-light-lamp-red');

        const yellow = this.createElement('traffic-light-lamp');
        yellow.classList.add('traffic-light-lamp-yellow');

        const green = this.createElement('traffic-light-lamp');
        green.classList.add('traffic-light-lamp-green');

        root.append(red, yellow, green);

        let timer: HTMLDivElement | null = null;

        if (this.trafficLightTimersVisible) {
            timer = this.createElement('traffic-light-timer');
            root.append(timer);
        }

        const { parent, chunk } = this.getStaticParent('trafficLights', x, y);

        parent.appendChild(root);

        if (chunk) {
            chunk.trafficLightCount += 1;
        }

        return {
            root,
            red,
            yellow,
            green,
            timer,
            lastColor: null,
            lastTimerText: '',
            chunk,
        };
    }

    private updateTrafficLights(states: readonly TrafficLightRenderState[]): void {
        for (const state of states) {
            const elements = this.trafficLightElements.get(state.key);

            // A culled light keeps its old state until its chunk is visible again.
            if (!elements || (elements.chunk !== null && !elements.chunk.visible)) {
                continue;
            }

            if (elements.lastColor !== state.color) {
                elements.red.classList.toggle('is-active', state.color === 'red');
                elements.yellow.classList.toggle('is-active', state.color === 'yellow');
                elements.green.classList.toggle('is-active', state.color === 'green');

                elements.lastColor = state.color;
            }

            if (!elements.timer) {
                continue;
            }

            const timerText = `${(state.remainingTime / 1000).toFixed(1)}s`;

            if (elements.lastTimerText !== timerText) {
                elements.timer.textContent = timerText;
                elements.lastTimerText = timerText;
            }
        }
    }

    private updateVehicles(vehicles: readonly VehicleState[]): void {
        for (let index = 0; index < vehicles.length; index += 1) {
            const vehicle = vehicles[index];
            let entry = this.vehicleElements[index];

            if (!entry) {
                const element = this.createVehicle();

                this.vehiclesLayer.appendChild(element);
                entry = { element, x: Number.NaN, y: Number.NaN, angle: Number.NaN };
                this.vehicleElements.push(entry);
            }

            // Standing vehicles (often most of them) keep their transform untouched.
            if (
                entry.x === vehicle.position.x &&
                entry.y === vehicle.position.y &&
                entry.angle === vehicle.angle
            ) {
                continue;
            }

            entry.element.style.transform =
                `translate3d(` +
                `${this.offsetX(vehicle.position.x)}px, ` +
                `${this.offsetY(vehicle.position.y)}px, 0) ` +
                `translate(-50%, -50%) ` +
                `rotate(${vehicle.angle}rad)`;

            entry.x = vehicle.position.x;
            entry.y = vehicle.position.y;
            entry.angle = vehicle.angle;
        }

        // The vehicle count only changes with the scenario.
        while (this.vehicleElements.length > vehicles.length) {
            this.vehicleElements.pop()?.element.remove();
        }
    }

    private createVehicle(): HTMLImageElement {
        const element = document.createElement('img');

        element.className = 'vehicle';
        element.src = DOMRenderer.VEHICLE_IMAGE_URL;
        element.alt = '';
        element.draggable = false;
        element.decoding = 'async';
        element.setAttribute('aria-hidden', 'true');

        // Explicit dimensions keep the vehicle's physical footprint consistent with the simulation.
        element.style.width = `${this.vehicleLength}px`;
        element.style.height = `${this.vehicleWidth}px`;

        return element;
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
