import {
    Application,
    Assets,
    Container,
    Graphics,
    Particle,
    ParticleContainer,
    Rectangle,
    Sprite,
    Text,
    Texture,
    WebGLRenderer,
} from 'pixi.js';

import type { Road } from '@core/map/road';
import type { RoadMap } from '@core/map/road-map';
import type { VehicleState } from '@core/vehicles/vehicle-state';

import type { Renderer, RenderState, TrafficLightRenderState } from '@rendering/renderer';

export interface PixiRendererOptions {
    container: HTMLElement;
    padding: number;
    roadWidth: number;
    vehicleLength: number;
    vehicleWidth: number;
    preference?: 'webgl' | 'webgpu';
}

interface LampRenderObject {
    lamp: Sprite;
    glowOuter: Graphics;
    glowMiddle: Graphics;
    glowInner: Graphics;
}

interface TrafficLightRenderObject {
    root: Container;

    housing: Sprite;

    red: LampRenderObject;
    yellow: LampRenderObject;
    green: LampRenderObject;

    timer: Text;

    lastColor: TrafficLightRenderState['color'] | null;

    lastTimerText: string;
}

interface StaticMapChunk {
    roads: Graphics;
    lanes: Graphics;

    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface WebGLTimerExtension {
    TIME_ELAPSED_EXT: number;
    GPU_DISJOINT_EXT: number;
}

/*
 * =============================================================
 * VEHICLE IMAGE
 * =============================================================
 */

const VEHICLE_IMAGE_URL = new URL('../../assets/vehicle.webp', import.meta.url).href;

const VEHICLE_TEXTURE_SCALE = 4;

/*
 * =============================================================
 * TRAFFIC LIGHTS
 * =============================================================
 */

const TRAFFIC_LIGHT_WIDTH = 18;
const TRAFFIC_LIGHT_HEIGHT = 38;

const TRAFFIC_LIGHT_PADDING = 4;
const TRAFFIC_LIGHT_TIMER_OFFSET = 5;

const LAMP_RADIUS = 4;
const LAMP_SIZE = 8;

const RED_COLOR = 0xef4444;
const YELLOW_COLOR = 0xf59e0b;
const GREEN_COLOR = 0x22c55e;

const ROAD_COLOR = 0x3f444b;
const LANE_DIVIDER_COLOR = 0xd6d3d1;

const INACTIVE_LAMP_ALPHA = 0.18;
const ACTIVE_LAMP_ALPHA = 1;

const TRAFFIC_LIGHT_TEXTURE_SCALE = 4;

const GLOW_OUTER_RADIUS = 11;
const GLOW_MIDDLE_RADIUS = 8;
const GLOW_INNER_RADIUS = 6;

const GLOW_OUTER_ALPHA = 0.07;
const GLOW_MIDDLE_ALPHA = 0.14;
const GLOW_INNER_ALPHA = 0.24;

/*
 * =============================================================
 * STATIC MAP
 * =============================================================
 */

const STATIC_CHUNK_SIZE = 2000;

const STATIC_CHUNK_CULL_MARGIN = 300;

const ROAD_EXTENDED_MARGIN = 500;

/*
 * =============================================================
 * GPU TIMING
 * =============================================================
 *
 * WebGL only.
 *
 * We sample one out of every five frames. GPU timer queries are
 * asynchronous, so consumeGpuTime() returns the latest result
 * that has become available.
 */

const GPU_SAMPLE_INTERVAL = 5;

export class PixiRenderer implements Renderer {
    private readonly container: HTMLElement;
    private readonly padding: number;
    private readonly roadWidth: number;
    private readonly vehicleLength: number;
    private readonly vehicleWidth: number;
    private readonly preference: 'webgl' | 'webgpu';

    private app!: Application;

    private scene!: Container;
    private world!: Container;

    private roadsLayer!: Container;
    private lanesLayer!: Container;
    private trafficLightsLayer!: Container;
    private vehiclesLayer!: ParticleContainer;

    private initialized = false;
    private renderedRoadMap: RoadMap | null = null;

    /*
     * =============================================================
     * WEBGL GPU TIMING
     * =============================================================
     */

    private webGl: WebGL2RenderingContext | null = null;

    private webGlTimerExtension: WebGLTimerExtension | null = null;

    private webGlActiveQuery: WebGLQuery | null = null;

    private readonly webGlPendingQueries: WebGLQuery[] = [];

    private gpuTimingFrameCounter = 0;

    private gpuTimingSampleThisFrame = false;

    private latestGpuTimeMs: number | null = null;

    private gpuTimeAvailable = false;

    /*
     * =============================================================
     * TEXTURES
     * =============================================================
     */

    private vehicleTexture!: Texture;

    private trafficLightHousingTexture!: Texture;
    private trafficLightRedTexture!: Texture;
    private trafficLightYellowTexture!: Texture;
    private trafficLightGreenTexture!: Texture;

    /*
     * =============================================================
     * TRAFFIC LIGHTS
     * =============================================================
     */

    private readonly trafficLightElements = new Map<string, TrafficLightRenderObject>();

    /*
     * =============================================================
     * VEHICLES
     * =============================================================
     *
     * Persistent vehicle particles.
     */

    private readonly vehicleParticles: Particle[] = [];

    /*
     * =============================================================
     * STATIC MAP CHUNKS
     * =============================================================
     *
     * Each chunk has exactly:
     *
     *   1 road Graphics
     *   1 lane Graphics
     *
     * regardless of how many roads exist inside the chunk.
     */

    private readonly staticMapChunks = new Map<string, StaticMapChunk>();

    private mapMinX = 0;
    private mapMinY = 0;
    private mapMaxX = 0;
    private mapMaxY = 0;

    /*
     * =============================================================
     * CAMERA
     * =============================================================
     */

    private cameraX = 0;
    private cameraY = 0;

    private viewportWidth = 1;
    private viewportHeight = 1;

    /*
     * =============================================================
     * POINTER
     * =============================================================
     */

    private resizeObserver?: ResizeObserver;

    private isDragging = false;

    private dragStartX = 0;
    private dragStartY = 0;

    private dragOriginX = 0;
    private dragOriginY = 0;

    constructor(options: PixiRendererOptions) {
        this.container = options.container;

        this.padding = options.padding;

        this.roadWidth = options.roadWidth;

        this.vehicleLength = options.vehicleLength;

        this.vehicleWidth = options.vehicleWidth;

        this.preference = options.preference ?? 'webgl';
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        const devicePixelRatio = window.devicePixelRatio || 1;

        const resolution = Math.min(Math.max(devicePixelRatio, 1), 2);

        this.app = new Application();

        await this.app.init({
            width: 1,
            height: 1,

            resolution,
            autoDensity: true,

            antialias: false,

            backgroundAlpha: 0,
            autoStart: false,

            preference: this.preference,
        });

        this.scene = new Container();

        this.world = new Container();

        this.roadsLayer = new Container();

        this.lanesLayer = new Container();

        this.trafficLightsLayer = new Container();

        /*
         * Vehicle rendering stays in a ParticleContainer.
         */
        this.vehiclesLayer = new ParticleContainer({
            dynamicProperties: {
                position: true,
                rotation: true,
                scale: false,
                color: false,
            },

            boundsArea: new Rectangle(0, 0, 1, 1),
        });

        this.scene.label = 'scene';

        this.world.label = 'world';

        this.roadsLayer.label = 'roads-layer';

        this.lanesLayer.label = 'lanes-layer';

        this.trafficLightsLayer.label = 'traffic-lights-layer';

        this.vehiclesLayer.label = 'vehicles-layer';

        this.vehicleTexture = await this.createVehicleTexture();

        this.trafficLightHousingTexture = this.createTrafficLightHousingTexture();

        this.trafficLightRedTexture = this.createTrafficLightLampTexture(RED_COLOR);

        this.trafficLightYellowTexture = this.createTrafficLightLampTexture(YELLOW_COLOR);

        this.trafficLightGreenTexture = this.createTrafficLightLampTexture(GREEN_COLOR);

        this.world.addChild(
            this.roadsLayer,
            this.lanesLayer,
            this.trafficLightsLayer,
            this.vehiclesLayer,
        );

        this.scene.addChild(this.world);

        this.app.stage.addChild(this.scene);

        this.container.replaceChildren(this.app.canvas);

        this.app.canvas.style.display = 'block';

        this.app.canvas.style.width = '100%';

        this.app.canvas.style.height = '100%';

        this.app.canvas.style.background = 'transparent';

        this.app.canvas.style.borderRadius = '16px';

        this.app.canvas.style.border = '1px solid #475569';

        this.app.canvas.style.boxSizing = 'border-box';

        this.bindPointerEvents();

        this.bindResize();

        this.initialized = true;

        /*
         * GPU timing is only initialized for WebGL.
         */
        this.setupWebGlGpuTiming();

        this.resizeViewport();
    }

    render(state: RenderState): void {
        if (!this.initialized) {
            return;
        }

        if (state.roadMap !== this.renderedRoadMap) {
            this.buildMap(state.roadMap);

            this.buildTrafficLights(state.trafficLights);

            this.renderedRoadMap = state.roadMap;

            this.resizeViewport();
        }

        this.updateTrafficLights(state.trafficLights);

        this.updateVehicles(state.vehicles);

        this.updateCameraTransform();

        this.updateStaticChunkVisibility();

        this.updateTrafficLightVisibility();

        this.app.render();
    }

    /*
     * =============================================================
     * GPU TIMING API
     * =============================================================
     *
     * These methods are intentionally not part of Renderer.
     * main.ts can detect them through its optional GPU-timing interface.
     */

    beginGpuTiming(): void {
        if (this.preference !== 'webgl') {
            return;
        }

        this.gpuTimingFrameCounter += 1;

        this.gpuTimingSampleThisFrame = this.gpuTimingFrameCounter % GPU_SAMPLE_INTERVAL === 0;

        if (!this.gpuTimingSampleThisFrame) {
            return;
        }

        if (!this.webGl || !this.webGlTimerExtension || this.webGlActiveQuery) {
            return;
        }

        const query = this.webGl.createQuery();

        if (!query) {
            return;
        }

        this.webGl.beginQuery(this.webGlTimerExtension.TIME_ELAPSED_EXT, query);

        this.webGlActiveQuery = query;
    }

    endGpuTiming(): void {
        if (this.preference !== 'webgl' || !this.gpuTimingSampleThisFrame) {
            return;
        }

        if (!this.webGl || !this.webGlTimerExtension || !this.webGlActiveQuery) {
            return;
        }

        this.webGl.endQuery(this.webGlTimerExtension.TIME_ELAPSED_EXT);

        this.webGlPendingQueries.push(this.webGlActiveQuery);

        this.webGlActiveQuery = null;
    }

    consumeGpuTime(): number | null {
        if (this.preference !== 'webgl') {
            return null;
        }

        this.pollWebGlTiming();

        if (!this.gpuTimeAvailable) {
            return null;
        }

        this.gpuTimeAvailable = false;

        return this.latestGpuTimeMs;
    }

    resetGpuTiming(): void {
        this.resetWebGlTiming();

        this.gpuTimingFrameCounter = 0;

        this.gpuTimingSampleThisFrame = false;

        this.latestGpuTimeMs = null;

        this.gpuTimeAvailable = false;
    }

    /*
     * =============================================================
     * WEBGL GPU TIMING
     * =============================================================
     */

    private setupWebGlGpuTiming(): void {
        if (this.preference !== 'webgl') {
            return;
        }

        const renderer = this.app.renderer as WebGLRenderer;

        this.webGl = renderer.gl;

        this.webGlTimerExtension = this.webGl.getExtension(
            'EXT_disjoint_timer_query_webgl2',
        ) as WebGLTimerExtension | null;
    }

    private pollWebGlTiming(): void {
        if (!this.webGl || !this.webGlTimerExtension) {
            return;
        }

        /*
         * A disjoint event invalidates the GPU timing result.
         */
        if (this.webGl.getParameter(this.webGlTimerExtension.GPU_DISJOINT_EXT)) {
            return;
        }

        for (let i = this.webGlPendingQueries.length - 1; i >= 0; i -= 1) {
            const query = this.webGlPendingQueries[i];

            const available = this.webGl.getQueryParameter(
                query,
                this.webGl.QUERY_RESULT_AVAILABLE,
            ) as boolean;

            if (!available) {
                continue;
            }

            const nanoseconds = this.webGl.getQueryParameter(
                query,
                this.webGl.QUERY_RESULT,
            ) as number;

            this.webGl.deleteQuery(query);

            this.webGlPendingQueries.splice(i, 1);

            this.latestGpuTimeMs = nanoseconds / 1_000_000;

            this.gpuTimeAvailable = true;
        }
    }

    private resetWebGlTiming(): void {
        if (!this.webGl) {
            this.webGlPendingQueries.length = 0;

            this.webGlActiveQuery = null;

            return;
        }

        if (this.webGlActiveQuery) {
            this.webGl.deleteQuery(this.webGlActiveQuery);

            this.webGlActiveQuery = null;
        }

        for (const query of this.webGlPendingQueries) {
            this.webGl.deleteQuery(query);
        }

        this.webGlPendingQueries.length = 0;
    }

    // =====================================================================
    // VEHICLE TEXTURE
    // =====================================================================

    private async createVehicleTexture(): Promise<Texture> {
        const sourceTexture = await Assets.load<Texture>(VEHICLE_IMAGE_URL);

        if (!sourceTexture) {
            throw new Error(`Unable to load vehicle image: ${VEHICLE_IMAGE_URL}`);
        }

        const scale = VEHICLE_TEXTURE_SCALE;

        const targetWidth = Math.max(1, Math.ceil(this.vehicleLength * scale));

        const targetHeight = Math.max(1, Math.ceil(this.vehicleWidth * scale));

        const canvas = document.createElement('canvas');

        canvas.width = targetWidth;

        canvas.height = targetHeight;

        const context = canvas.getContext('2d');

        if (!context) {
            sourceTexture.destroy(true);

            throw new Error('Unable to create vehicle texture canvas.');
        }

        context.imageSmoothingEnabled = true;

        context.imageSmoothingQuality = 'high';

        context.clearRect(0, 0, targetWidth, targetHeight);

        const source = sourceTexture.source.resource;

        if (!this.isCanvasImageSource(source)) {
            sourceTexture.destroy(true);

            throw new Error('Vehicle texture source is not a drawable image.');
        }

        context.drawImage(source, 0, 0, targetWidth, targetHeight);

        const texture = Texture.from(canvas, true);

        texture.source.scaleMode = 'linear';

        texture.source.autoGenerateMipmaps = false;

        sourceTexture.destroy(true);

        return texture;
    }

    private isCanvasImageSource(value: unknown): value is CanvasImageSource {
        if (typeof HTMLImageElement !== 'undefined' && value instanceof HTMLImageElement) {
            return true;
        }

        if (typeof HTMLCanvasElement !== 'undefined' && value instanceof HTMLCanvasElement) {
            return true;
        }

        if (typeof HTMLVideoElement !== 'undefined' && value instanceof HTMLVideoElement) {
            return true;
        }

        if (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) {
            return true;
        }

        if (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas) {
            return true;
        }

        return false;
    }

    // =====================================================================
    // TRAFFIC LIGHT TEXTURES
    // =====================================================================

    private createTrafficLightHousingTexture(): Texture {
        const scale = TRAFFIC_LIGHT_TEXTURE_SCALE;

        const canvas = document.createElement('canvas');

        canvas.width = TRAFFIC_LIGHT_WIDTH * scale;

        canvas.height = TRAFFIC_LIGHT_HEIGHT * scale;

        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create traffic light housing texture canvas.');
        }

        context.scale(scale, scale);

        this.drawRoundedRectPath(
            context,
            0.5,
            0.5,
            TRAFFIC_LIGHT_WIDTH - 1,
            TRAFFIC_LIGHT_HEIGHT - 1,
            5,
        );

        context.fillStyle = '#111827';

        context.fill();

        context.strokeStyle = '#374151';

        context.lineWidth = 1;

        context.stroke();

        return Texture.from(canvas, true);
    }

    private createTrafficLightLampTexture(color: number): Texture {
        const scale = TRAFFIC_LIGHT_TEXTURE_SCALE;

        const canvas = document.createElement('canvas');

        canvas.width = LAMP_SIZE * scale;

        canvas.height = LAMP_SIZE * scale;

        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create traffic light lamp texture canvas.');
        }

        context.scale(scale, scale);

        context.beginPath();

        context.arc(LAMP_RADIUS, LAMP_RADIUS, LAMP_RADIUS - 0.25, 0, Math.PI * 2);

        context.closePath();

        context.fillStyle = this.numberToCssColor(color);

        context.fill();

        return Texture.from(canvas, true);
    }

    private numberToCssColor(color: number): string {
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    private drawRoundedRectPath(
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
    ): void {
        const r = Math.min(radius, width / 2, height / 2);

        context.beginPath();

        context.moveTo(x + r, y);

        context.lineTo(x + width - r, y);

        context.quadraticCurveTo(x + width, y, x + width, y + r);

        context.lineTo(x + width, y + height - r);

        context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);

        context.lineTo(x + r, y + height);

        context.quadraticCurveTo(x, y + height, x, y + height - r);

        context.lineTo(x, y + r);

        context.quadraticCurveTo(x, y, x + r, y);

        context.closePath();
    }

    // =====================================================================
    // MAP
    // =====================================================================

    private buildMap(roadMap: RoadMap): void {
        this.roadsLayer.removeChildren();

        this.lanesLayer.removeChildren();

        this.staticMapChunks.clear();

        const nodes = roadMap.getNodes();

        if (nodes.length === 0) {
            this.mapMinX = 0;

            this.mapMinY = 0;

            this.mapMaxX = 1;

            this.mapMaxY = 1;

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

        this.mapMaxX = maxX;

        this.mapMaxY = maxY;

        const extension = this.roadWidth / 2;

        const worldWidth = this.mapMaxX - this.mapMinX + this.padding * 2 + extension * 2;

        const worldHeight = this.mapMaxY - this.mapMinY + this.padding * 2 + extension * 2;

        this.vehiclesLayer.boundsArea = new Rectangle(
            0,
            0,
            Math.max(1, worldWidth),
            Math.max(1, worldHeight),
        );

        for (const road of roadMap.getRoads()) {
            const chunk = this.getOrCreateStaticChunk(road);

            this.addRoadGeometry(chunk.roads, road);

            this.addLaneDividerGeometry(chunk.lanes, road);
        }

        this.updateStaticChunkVisibility();
    }

    private getOrCreateStaticChunk(road: Road): StaticMapChunk {
        const nodeA = road.getNodeA().getPosition();

        const nodeB = road.getNodeB().getPosition();

        const midpointX = (this.offsetX(nodeA.x) + this.offsetX(nodeB.x)) / 2;

        const midpointY = (this.offsetY(nodeA.y) + this.offsetY(nodeB.y)) / 2;

        const chunkX = Math.floor(midpointX / STATIC_CHUNK_SIZE);

        const chunkY = Math.floor(midpointY / STATIC_CHUNK_SIZE);

        const key = `${chunkX}:${chunkY}`;

        const existing = this.staticMapChunks.get(key);

        if (existing) {
            return existing;
        }

        const minX = chunkX * STATIC_CHUNK_SIZE - ROAD_EXTENDED_MARGIN;

        const minY = chunkY * STATIC_CHUNK_SIZE - ROAD_EXTENDED_MARGIN;

        const maxX = (chunkX + 1) * STATIC_CHUNK_SIZE + ROAD_EXTENDED_MARGIN;

        const maxY = (chunkY + 1) * STATIC_CHUNK_SIZE + ROAD_EXTENDED_MARGIN;

        const roads = new Graphics();

        const lanes = new Graphics();

        roads.label = `roads-chunk-${key}`;

        lanes.label = `lanes-chunk-${key}`;

        this.roadsLayer.addChild(roads);

        this.lanesLayer.addChild(lanes);

        const chunk: StaticMapChunk = {
            roads,
            lanes,

            minX,
            minY,
            maxX,
            maxY,
        };

        this.staticMapChunks.set(key, chunk);

        return chunk;
    }

    private addRoadGeometry(graphics: Graphics, road: Road): void {
        const start = road.getNodeA().getPosition();

        const end = road.getNodeB().getPosition();

        const startX = this.offsetX(start.x);

        const startY = this.offsetY(start.y);

        const endX = this.offsetX(end.x);

        const endY = this.offsetY(end.y);

        const dx = endX - startX;

        const dy = endY - startY;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const directionX = dx / length;

        const directionY = dy / length;

        const halfWidth = this.roadWidth / 2;

        /*
         * Extend the road to the intersection center.
         * This preserves the appearance of the original renderer.
         */
        const extendedStartX = startX - directionX * halfWidth;

        const extendedStartY = startY - directionY * halfWidth;

        const extendedEndX = endX + directionX * halfWidth;

        const extendedEndY = endY + directionY * halfWidth;

        /*
         * Perpendicular vector.
         */
        const normalX = -directionY * halfWidth;

        const normalY = directionX * halfWidth;

        /*
         * Construct the road as one filled polygon.
         *
         * No child Graphics object.
         * No rotation.
         * No transform.
         */
        graphics
            .moveTo(extendedStartX + normalX, extendedStartY + normalY)
            .lineTo(extendedEndX + normalX, extendedEndY + normalY)
            .lineTo(extendedEndX - normalX, extendedEndY - normalY)
            .lineTo(extendedStartX - normalX, extendedStartY - normalY)
            .closePath();

        graphics.fill({
            color: ROAD_COLOR,
            alpha: 1,
        });
    }

    private addLaneDividerGeometry(graphics: Graphics, road: Road): void {
        const start = road.getNodeA().getPosition();

        const end = road.getNodeB().getPosition();

        const startX = this.offsetX(start.x);

        const startY = this.offsetY(start.y);

        const endX = this.offsetX(end.x);

        const endY = this.offsetY(end.y);

        const dx = endX - startX;

        const dy = endY - startY;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const directionX = dx / length;

        const directionY = dy / length;

        const perpendicularX = -directionY;

        const perpendicularY = directionX;

        const dashLength = 10;

        const gapLength = 10;

        const halfThickness = 0.5;

        for (let distance = 0; distance < length; distance += dashLength + gapLength) {
            const currentLength = Math.min(dashLength, length - distance);

            if (currentLength <= 0) {
                break;
            }

            const dashStartX = startX + directionX * distance;

            const dashStartY = startY + directionY * distance;

            const dashEndX = dashStartX + directionX * currentLength;

            const dashEndY = dashStartY + directionY * currentLength;

            const offsetX = perpendicularX * halfThickness;

            const offsetY = perpendicularY * halfThickness;

            /*
             * One rectangle per dash, but all rectangles are
             * accumulated into the SAME chunk Graphics object.
             */
            graphics
                .moveTo(dashStartX + offsetX, dashStartY + offsetY)
                .lineTo(dashEndX + offsetX, dashEndY + offsetY)
                .lineTo(dashEndX - offsetX, dashEndY - offsetY)
                .lineTo(dashStartX - offsetX, dashStartY - offsetY)
                .closePath();
        }

        graphics.fill({
            color: LANE_DIVIDER_COLOR,
            alpha: 0.8,
        });
    }

    private updateStaticChunkVisibility(): void {
        const visibleMinX = -this.cameraX - STATIC_CHUNK_CULL_MARGIN;

        const visibleMinY = -this.cameraY - STATIC_CHUNK_CULL_MARGIN;

        const visibleMaxX = -this.cameraX + this.viewportWidth + STATIC_CHUNK_CULL_MARGIN;

        const visibleMaxY = -this.cameraY + this.viewportHeight + STATIC_CHUNK_CULL_MARGIN;

        for (const chunk of this.staticMapChunks.values()) {
            const visible =
                chunk.maxX >= visibleMinX &&
                chunk.minX <= visibleMaxX &&
                chunk.maxY >= visibleMinY &&
                chunk.minY <= visibleMaxY;

            chunk.roads.visible = visible;

            chunk.lanes.visible = visible;
        }
    }

    // =====================================================================
    // TRAFFIC LIGHTS
    // =====================================================================

    private buildTrafficLights(states: readonly TrafficLightRenderState[]): void {
        this.trafficLightsLayer.removeChildren();

        this.trafficLightElements.clear();

        for (const state of states) {
            const elements = this.createTrafficLight(state);

            this.trafficLightElements.set(state.key, elements);

            this.trafficLightsLayer.addChild(elements.root);
        }
    }

    private createTrafficLight(state: TrafficLightRenderState): TrafficLightRenderObject {
        const root = new Container();

        root.position.set(this.offsetX(state.position.x), this.offsetY(state.position.y));

        const housing = new Sprite(this.trafficLightHousingTexture);

        housing.anchor.set(0.5, 0.5);

        housing.width = TRAFFIC_LIGHT_WIDTH;

        housing.height = TRAFFIC_LIGHT_HEIGHT;

        const red = this.createLamp(
            this.trafficLightRedTexture,
            -TRAFFIC_LIGHT_HEIGHT / 2 + TRAFFIC_LIGHT_PADDING,
        );

        const yellow = this.createLamp(this.trafficLightYellowTexture, -LAMP_SIZE / 2);

        const green = this.createLamp(
            this.trafficLightGreenTexture,
            TRAFFIC_LIGHT_HEIGHT / 2 - TRAFFIC_LIGHT_PADDING - LAMP_SIZE,
        );

        const timer = new Text({
            text: '',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: 0xe5e7eb,
            },
        });

        timer.anchor.set(0, 0.5);

        timer.position.set(TRAFFIC_LIGHT_WIDTH / 2 + TRAFFIC_LIGHT_TIMER_OFFSET, 0);

        root.addChild(
            housing,

            red.glowOuter,
            red.glowMiddle,
            red.glowInner,

            yellow.glowOuter,
            yellow.glowMiddle,
            yellow.glowInner,

            green.glowOuter,
            green.glowMiddle,
            green.glowInner,

            red.lamp,
            yellow.lamp,
            green.lamp,

            timer,
        );

        const object: TrafficLightRenderObject = {
            root,

            housing,

            red,
            yellow,
            green,

            timer,

            lastColor: null,

            lastTimerText: '',
        };

        this.updateTrafficLightObject(object, state);

        return object;
    }

    private createLamp(texture: Texture, y: number): LampRenderObject {
        const lamp = new Sprite(texture);

        lamp.anchor.set(0.5, 0.5);

        lamp.width = LAMP_SIZE;

        lamp.height = LAMP_SIZE;

        lamp.position.set(0, y + LAMP_SIZE / 2);

        lamp.alpha = INACTIVE_LAMP_ALPHA;

        const glowOuter = new Graphics();

        glowOuter.circle(GLOW_OUTER_RADIUS, GLOW_OUTER_RADIUS, GLOW_OUTER_RADIUS).fill({
            color: 0xffffff,
            alpha: 1,
        });

        glowOuter.position.set(-GLOW_OUTER_RADIUS, y + LAMP_SIZE / 2 - GLOW_OUTER_RADIUS);

        glowOuter.visible = false;

        glowOuter.alpha = 0;

        const glowMiddle = new Graphics();

        glowMiddle.circle(GLOW_MIDDLE_RADIUS, GLOW_MIDDLE_RADIUS, GLOW_MIDDLE_RADIUS).fill({
            color: 0xffffff,
            alpha: 1,
        });

        glowMiddle.position.set(-GLOW_MIDDLE_RADIUS, y + LAMP_SIZE / 2 - GLOW_MIDDLE_RADIUS);

        glowMiddle.visible = false;

        glowMiddle.alpha = 0;

        const glowInner = new Graphics();

        glowInner.circle(GLOW_INNER_RADIUS, GLOW_INNER_RADIUS, GLOW_INNER_RADIUS).fill({
            color: 0xffffff,
            alpha: 1,
        });

        glowInner.position.set(-GLOW_INNER_RADIUS, y + LAMP_SIZE / 2 - GLOW_INNER_RADIUS);

        glowInner.visible = false;

        glowInner.alpha = 0;

        return {
            lamp,

            glowOuter,

            glowMiddle,

            glowInner,
        };
    }

    private updateTrafficLights(states: readonly TrafficLightRenderState[]): void {
        for (const state of states) {
            const elements = this.trafficLightElements.get(state.key);

            if (!elements) {
                continue;
            }

            this.updateTrafficLightObject(elements, state);
        }
    }

    private updateTrafficLightObject(
        elements: TrafficLightRenderObject,
        state: TrafficLightRenderState,
    ): void {
        if (elements.lastColor !== state.color) {
            elements.red.lamp.alpha =
                state.color === 'red' ? ACTIVE_LAMP_ALPHA : INACTIVE_LAMP_ALPHA;

            elements.yellow.lamp.alpha =
                state.color === 'yellow' ? ACTIVE_LAMP_ALPHA : INACTIVE_LAMP_ALPHA;

            elements.green.lamp.alpha =
                state.color === 'green' ? ACTIVE_LAMP_ALPHA : INACTIVE_LAMP_ALPHA;

            this.setGlowState(elements.red, state.color === 'red', RED_COLOR);

            this.setGlowState(elements.yellow, state.color === 'yellow', YELLOW_COLOR);

            this.setGlowState(elements.green, state.color === 'green', GREEN_COLOR);

            elements.lastColor = state.color;
        }

        const timerText = `${(state.remainingTime / 1000).toFixed(1)}s`;

        if (elements.lastTimerText !== timerText) {
            elements.timer.text = timerText;

            elements.lastTimerText = timerText;
        }
    }

    private setGlowState(lamp: LampRenderObject, active: boolean, color: number): void {
        if (!active) {
            lamp.glowOuter.visible = false;

            lamp.glowMiddle.visible = false;

            lamp.glowInner.visible = false;

            return;
        }

        lamp.glowOuter.tint = color;

        lamp.glowMiddle.tint = color;

        lamp.glowInner.tint = color;

        lamp.glowOuter.alpha = GLOW_OUTER_ALPHA;

        lamp.glowMiddle.alpha = GLOW_MIDDLE_ALPHA;

        lamp.glowInner.alpha = GLOW_INNER_ALPHA;

        lamp.glowOuter.visible = true;

        lamp.glowMiddle.visible = true;

        lamp.glowInner.visible = true;
    }

    // =====================================================================
    // VEHICLES
    // =====================================================================

    private updateVehicles(vehicles: readonly VehicleState[]): void {
        const count = vehicles.length;

        this.ensureVehicleCount(count);

        for (let i = 0; i < count; i += 1) {
            const vehicle = vehicles[i];

            const particle = this.vehicleParticles[i];

            particle.x = this.offsetX(vehicle.position.x);

            particle.y = this.offsetY(vehicle.position.y);

            particle.rotation = vehicle.angle;
        }
    }

    private ensureVehicleCount(count: number): void {
        const currentCount = this.vehicleParticles.length;

        if (count === currentCount) {
            return;
        }

        if (count > currentCount) {
            for (let i = currentCount; i < count; i += 1) {
                const particle = this.createVehicle();

                this.vehicleParticles.push(particle);

                this.vehiclesLayer.addParticle(particle);
            }

            this.vehiclesLayer.update();

            return;
        }

        this.vehiclesLayer.removeParticles(count, currentCount);

        this.vehicleParticles.length = count;
    }

    private createVehicle(): Particle {
        const textureWidth = this.vehicleTexture.width;

        const textureHeight = this.vehicleTexture.height;

        if (textureWidth <= 0 || textureHeight <= 0) {
            throw new Error('Vehicle texture has invalid dimensions.');
        }

        const scale = 1 / VEHICLE_TEXTURE_SCALE;

        return new Particle({
            texture: this.vehicleTexture,

            x: 0,
            y: 0,

            scaleX: scale,
            scaleY: scale,

            anchorX: 0.5,
            anchorY: 0.5,

            rotation: 0,

            tint: 0xffffff,
        });
    }

    // =====================================================================
    // CAMERA
    // =====================================================================

    private offsetX(x: number): number {
        return x - this.mapMinX + this.padding;
    }

    private offsetY(y: number): number {
        return y - this.mapMinY + this.padding;
    }

    private updateCameraTransform(): void {
        this.world.position.set(this.cameraX, this.cameraY);
    }

    private resizeViewport(): void {
        if (!this.initialized) {
            return;
        }

        const width = Math.max(1, this.container.clientWidth);

        const height = Math.max(1, this.container.clientHeight);

        this.viewportWidth = width;

        this.viewportHeight = height;

        this.app.renderer.resize(width, height);

        this.clampCamera();

        this.updateCameraTransform();

        this.updateStaticChunkVisibility();

        this.updateTrafficLightVisibility();
    }

    private clampCamera(): void {
        const contentWidth = this.mapMaxX - this.mapMinX + this.padding * 2;

        const contentHeight = this.mapMaxY - this.mapMinY + this.padding * 2;

        const minX = Math.min(0, this.viewportWidth - contentWidth);

        const minY = Math.min(0, this.viewportHeight - contentHeight);

        this.cameraX = Math.min(0, Math.max(minX, this.cameraX));

        this.cameraY = Math.min(0, Math.max(minY, this.cameraY));
    }

    private updateTrafficLightVisibility(): void {
        const left = -this.cameraX;

        const top = -this.cameraY;

        const right = left + this.viewportWidth;

        const bottom = top + this.viewportHeight;

        for (const elements of this.trafficLightElements.values()) {
            const x = elements.root.x;

            const y = elements.root.y;

            elements.root.visible =
                x >= left - 50 && x <= right + 50 && y >= top - 50 && y <= bottom + 50;
        }
    }

    private bindPointerEvents(): void {
        const canvas = this.app.canvas;

        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', this.handlePointerDown);

        canvas.addEventListener('pointermove', this.handlePointerMove);

        canvas.addEventListener('pointerup', this.handlePointerUp);

        canvas.addEventListener('pointercancel', this.handlePointerUp);

        canvas.addEventListener('pointerleave', this.handlePointerUp);
    }

    private unbindPointerEvents(): void {
        if (!this.app?.canvas) {
            return;
        }

        const canvas = this.app.canvas;

        canvas.removeEventListener('pointerdown', this.handlePointerDown);

        canvas.removeEventListener('pointermove', this.handlePointerMove);

        canvas.removeEventListener('pointerup', this.handlePointerUp);

        canvas.removeEventListener('pointercancel', this.handlePointerUp);

        canvas.removeEventListener('pointerleave', this.handlePointerUp);
    }

    private readonly handlePointerDown = (event: PointerEvent): void => {
        if (event.button !== 0) {
            return;
        }

        this.isDragging = true;

        this.dragStartX = event.clientX;

        this.dragStartY = event.clientY;

        this.dragOriginX = this.cameraX;

        this.dragOriginY = this.cameraY;

        this.app.canvas.setPointerCapture(event.pointerId);
    };

    private readonly handlePointerMove = (event: PointerEvent): void => {
        if (!this.isDragging) {
            return;
        }

        this.cameraX = this.dragOriginX + (event.clientX - this.dragStartX);

        this.cameraY = this.dragOriginY + (event.clientY - this.dragStartY);

        this.clampCamera();

        this.updateCameraTransform();

        this.updateStaticChunkVisibility();

        this.updateTrafficLightVisibility();
    };

    private readonly handlePointerUp = (event: PointerEvent): void => {
        if (!this.isDragging) {
            return;
        }

        this.isDragging = false;

        if (this.app.canvas.hasPointerCapture(event.pointerId)) {
            this.app.canvas.releasePointerCapture(event.pointerId);
        }
    };

    private bindResize(): void {
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeViewport();
        });

        this.resizeObserver.observe(this.container);
    }

    destroy(): void {
        this.resizeObserver?.disconnect();

        this.resizeObserver = undefined;

        this.unbindPointerEvents();

        this.trafficLightElements.clear();

        this.vehicleParticles.length = 0;

        this.staticMapChunks.clear();

        if (this.vehicleTexture) {
            this.vehicleTexture.destroy(true);
        }

        if (this.trafficLightHousingTexture) {
            this.trafficLightHousingTexture.destroy(true);
        }

        if (this.trafficLightRedTexture) {
            this.trafficLightRedTexture.destroy(true);
        }

        if (this.trafficLightYellowTexture) {
            this.trafficLightYellowTexture.destroy(true);
        }

        if (this.trafficLightGreenTexture) {
            this.trafficLightGreenTexture.destroy(true);
        }

        this.resetGpuTiming();

        this.webGl = null;

        this.webGlTimerExtension = null;

        if (this.app) {
            this.app.destroy(true, {
                children: true,
                texture: false,
            });
        }

        this.container.replaceChildren();

        this.initialized = false;

        this.renderedRoadMap = null;

        this.cameraX = 0;

        this.cameraY = 0;

        this.viewportWidth = 1;

        this.viewportHeight = 1;
    }
}
