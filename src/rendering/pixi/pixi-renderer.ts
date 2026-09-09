import {
    Application,
    Container,
    Graphics,
    Particle,
    ParticleContainer,
    Rectangle,
    Sprite,
    Text,
    Texture,
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

/*
 * High resolution source artwork.
 *
 * The visible traffic light is still only 18x38 logical pixels.
 */
const TRAFFIC_LIGHT_TEXTURE_SCALE = 4;

/*
 * Glow remains separate from the texture so it can change state without
 * rebuilding the traffic-light artwork.
 */
const GLOW_OUTER_RADIUS = 11;
const GLOW_MIDDLE_RADIUS = 8;
const GLOW_INNER_RADIUS = 6;

const GLOW_OUTER_ALPHA = 0.07;
const GLOW_MIDDLE_ALPHA = 0.14;
const GLOW_INNER_ALPHA = 0.24;

const VEHICLE_BORDER_RADIUS = 3;

const VEHICLE_TEXTURE_SCALE = 4;

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
    private mapInitialized = false;

    private readonly trafficLightElements = new Map<string, TrafficLightRenderObject>();

    private readonly vehicleParticles: Particle[] = [];

    private vehicleTexture!: Texture;

    /*
     * Traffic light artwork textures are shared by every light.
     */
    private trafficLightHousingTexture!: Texture;
    private trafficLightRedTexture!: Texture;
    private trafficLightYellowTexture!: Texture;
    private trafficLightGreenTexture!: Texture;

    private mapMinX = 0;
    private mapMinY = 0;
    private mapMaxX = 0;
    private mapMaxY = 0;

    private cameraX = 0;
    private cameraY = 0;

    private viewportWidth = 1;
    private viewportHeight = 1;

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

            /*
             * Keep hard-edged simulation geometry crisp.
             */
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

        /*
         * Create every shared texture exactly once.
         */
        this.vehicleTexture = this.createVehicleTexture();

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

        this.resizeViewport();
    }

    render(state: RenderState): void {
        if (!this.initialized) {
            return;
        }

        if (!this.mapInitialized) {
            this.buildMap(state.roadMap);

            this.buildTrafficLights(state.trafficLights);

            this.mapInitialized = true;

            this.resizeViewport();
        }

        this.updateTrafficLights(state.trafficLights);

        this.updateVehicles(state.vehicles);

        this.updateCameraTransform();

        this.updateTrafficLightVisibility();

        this.app.render();
    }

    destroy(): void {
        this.resizeObserver?.disconnect();

        this.resizeObserver = undefined;

        this.unbindPointerEvents();

        this.trafficLightElements.clear();

        this.vehicleParticles.length = 0;

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

        if (this.app) {
            this.app.destroy(true, {
                children: true,
                texture: false,
            });
        }

        this.container.replaceChildren();

        this.initialized = false;
        this.mapInitialized = false;

        this.cameraX = 0;
        this.cameraY = 0;

        this.viewportWidth = 1;
        this.viewportHeight = 1;
    }

    // =====================================================================
    // VEHICLE TEXTURE
    // =====================================================================

    private createVehicleTexture(): Texture {
        const scale = VEHICLE_TEXTURE_SCALE;

        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.ceil(this.vehicleLength * scale));

        canvas.height = Math.max(1, Math.ceil(this.vehicleWidth * scale));

        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create vehicle texture canvas.');
        }

        context.scale(scale, scale);

        this.drawRoundedRectPath(
            context,
            0.5,
            0.5,
            Math.max(0, this.vehicleLength - 1),
            Math.max(0, this.vehicleWidth - 1),
            VEHICLE_BORDER_RADIUS,
        );

        context.fillStyle = '#38bdf8';

        context.fill();

        context.strokeStyle = '#e0f2fe';

        context.lineWidth = 1;

        context.stroke();

        return Texture.from(canvas, true);
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

        /*
         * DOM equivalent:
         *
         * background: #111827;
         * border: 1px solid #374151;
         * border-radius: 5px;
         */
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

        /*
         * The texture itself is completely opaque.
         * Lamp opacity is controlled by Sprite.alpha.
         */
        context.fillStyle = this.numberToCssColor(color);

        context.fill();

        return Texture.from(canvas, true);
    }

    private numberToCssColor(color: number): string {
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    // =====================================================================
    // MAP
    // =====================================================================

    private buildMap(roadMap: RoadMap): void {
        this.roadsLayer.removeChildren();
        this.lanesLayer.removeChildren();

        const nodes = roadMap.getNodes();

        if (nodes.length === 0) {
            this.mapMinX = 0;
            this.mapMinY = 0;
            this.mapMaxX = 1;
            this.mapMaxY = 1;
        } else {
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
        }

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
            this.renderRoad(road);
            this.renderLaneDivider(road);
        }

        const resolution = this.app.renderer.resolution;

        if (this.roadsLayer.children.length > 0) {
            this.roadsLayer.cacheAsTexture({
                resolution,
                antialias: false,
            });
        }

        if (this.lanesLayer.children.length > 0) {
            this.lanesLayer.cacheAsTexture({
                resolution,
                antialias: false,
            });
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

        const extension = this.roadWidth / 2;

        const startX = start.x - Math.cos(rotation) * extension;

        const startY = start.y - Math.sin(rotation) * extension;

        const length = centerLength + extension * 2;

        const roadGraphics = new Graphics();

        roadGraphics.rect(0, -this.roadWidth / 2, length, this.roadWidth).fill({
            color: ROAD_COLOR,
            alpha: 1,
        });

        roadGraphics.position.set(this.offsetX(startX), this.offsetY(startY));

        roadGraphics.rotation = rotation;

        this.roadsLayer.addChild(roadGraphics);
    }

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

        const divider = new Graphics();

        const dashLength = 10;
        const gapLength = 10;

        for (let distance = 0; distance < length; distance += dashLength + gapLength) {
            const currentLength = Math.min(dashLength, length - distance);

            if (currentLength <= 0) {
                break;
            }

            divider.rect(distance, -0.5, currentLength, 1);
        }

        divider.fill({
            color: LANE_DIVIDER_COLOR,
            alpha: 0.8,
        });

        divider.position.set(this.offsetX(start.x), this.offsetY(start.y));

        divider.rotation = rotation;

        this.lanesLayer.addChild(divider);
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

        root.alpha = 1;

        root.position.set(this.offsetX(state.position.x), this.offsetY(state.position.y));

        /*
         * High-resolution shared housing texture.
         *
         * The texture is physically 4x larger, but we display it at exactly
         * 18x38 logical pixels.
         */
        const housing = new Sprite(this.trafficLightHousingTexture);

        housing.anchor.set(0.5, 0.5);

        housing.width = TRAFFIC_LIGHT_WIDTH;

        housing.height = TRAFFIC_LIGHT_HEIGHT;

        housing.alpha = 1;

        const red = this.createLamp(
            this.trafficLightRedTexture,
            -(TRAFFIC_LIGHT_HEIGHT / 2) + TRAFFIC_LIGHT_PADDING,
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

        timer.alpha = 1;

        /*
         * Housing first.
         * Glows behind lamps.
         * Actual lamps above glows.
         * Timer above everything.
         */
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

        /*
         * Texture itself is opaque.
         * This alpha controls inactive/active brightness.
         */
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
        /*
         * The container and housing remain fully visible.
         */
        elements.root.alpha = 1;
        elements.housing.alpha = 1;
        elements.timer.alpha = 1;

        if (elements.lastColor !== state.color) {
            this.setLampState(elements.red, state.color === 'red', RED_COLOR);

            this.setLampState(elements.yellow, state.color === 'yellow', YELLOW_COLOR);

            this.setLampState(elements.green, state.color === 'green', GREEN_COLOR);

            elements.lastColor = state.color;
        }

        const timerText = `${(state.remainingTime / 1000).toFixed(1)}s`;

        if (elements.lastTimerText !== timerText) {
            elements.timer.text = timerText;

            elements.lastTimerText = timerText;
        }
    }

    private setLampState(lamp: LampRenderObject, active: boolean, color: number): void {
        if (active) {
            lamp.lamp.alpha = ACTIVE_LAMP_ALPHA;

            /*
             * Re-color the existing glow graphics.
             *
             * The geometry stays persistent.
             */
            this.setGraphicsFillColor(lamp.glowOuter, color, GLOW_OUTER_ALPHA);

            this.setGraphicsFillColor(lamp.glowMiddle, color, GLOW_MIDDLE_ALPHA);

            this.setGraphicsFillColor(lamp.glowInner, color, GLOW_INNER_ALPHA);

            lamp.glowOuter.visible = true;
            lamp.glowMiddle.visible = true;
            lamp.glowInner.visible = true;

            return;
        }

        lamp.lamp.alpha = INACTIVE_LAMP_ALPHA;

        lamp.glowOuter.visible = false;
        lamp.glowMiddle.visible = false;
        lamp.glowInner.visible = false;

        lamp.glowOuter.alpha = 0;
        lamp.glowMiddle.alpha = 0;
        lamp.glowInner.alpha = 0;
    }

    private setGraphicsFillColor(graphics: Graphics, color: number, alpha: number): void {
        /*
         * The geometry was already created. We only need the visual alpha.
         *
         * Tint is not used here because the glow graphics have already been
         * built with white fill.
         */
        graphics.tint = color;
        graphics.alpha = alpha;
    }

    // =====================================================================
    // VEHICLES
    // =====================================================================

    private updateVehicles(vehicles: readonly VehicleState[]): void {
        this.ensureVehicleCount(vehicles.length);

        for (let i = 0; i < vehicles.length; i += 1) {
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
                const particle = new Particle({
                    texture: this.vehicleTexture,

                    x: 0,
                    y: 0,

                    /*
                     * The texture is already high resolution, but its
                     * displayed dimensions remain the intended 18x8.
                     */
                    scaleX: 1 / VEHICLE_TEXTURE_SCALE,

                    scaleY: 1 / VEHICLE_TEXTURE_SCALE,

                    anchorX: 0.5,
                    anchorY: 0.5,

                    rotation: 0,

                    tint: 0xffffff,
                });

                this.vehicleParticles.push(particle);

                this.vehiclesLayer.addParticle(particle);
            }

            this.vehiclesLayer.update();

            return;
        }

        this.vehiclesLayer.removeParticles(count, currentCount);

        this.vehicleParticles.length = count;
    }

    // =====================================================================
    // CAMERA / COORDINATES
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

    // =====================================================================
    // POINTER / CAMERA DRAG
    // =====================================================================

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

    // =====================================================================
    // RESIZE
    // =====================================================================

    private bindResize(): void {
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeViewport();
        });

        this.resizeObserver.observe(this.container);
    }
}
