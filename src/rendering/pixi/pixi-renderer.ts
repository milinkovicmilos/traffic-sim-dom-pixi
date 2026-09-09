import { Application, Container, Graphics, Text } from 'pixi.js';

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
}

interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

const COLORS = {
    road: 0x3f444b,
    laneDivider: 0xd6d3d1,

    housing: 0x111827,
    housingBorder: 0x374151,

    red: 0xef4444,
    yellow: 0xf59e0b,
    green: 0x22c55e,

    vehicle: 0x38bdf8,
    vehicleBorder: 0xe0f2fe,

    text: 0xe5e7eb,
} as const;

export class PixiRenderer implements Renderer {
    private readonly container: HTMLElement;
    private readonly padding: number;
    private readonly roadWidth: number;
    private readonly vehicleLength: number;
    private readonly vehicleWidth: number;

    private scene!: HTMLDivElement;

    private app!: Application;
    private world!: Container;

    private resizeObserver?: ResizeObserver;

    private initialized = false;
    private mapInitialized = false;

    private cameraX = 0;
    private cameraY = 0;

    private dragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private dragCameraX = 0;
    private dragCameraY = 0;

    private worldBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
    };

    constructor(options: PixiRendererOptions) {
        this.container = options.container;
        this.padding = options.padding;
        this.roadWidth = options.roadWidth;
        this.vehicleLength = options.vehicleLength;
        this.vehicleWidth = options.vehicleWidth;
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.createScene();

        this.app = new Application();

        await this.app.init({
            width: 1,
            height: 1,
            antialias: true,
            backgroundAlpha: 0,
            autoStart: false,
        });

        this.world = new Container();

        this.app.stage.addChild(this.world);

        const canvas = this.app.canvas;

        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.pointerEvents = 'none';

        this.scene.appendChild(canvas);

        this.attachPointerHandlers();

        this.resizeObserver = new ResizeObserver(() => {
            this.resizeViewport();
        });

        this.resizeObserver.observe(this.scene);

        this.resizeViewport();

        this.initialized = true;
    }

    render(state: RenderState): void {
        if (!this.initialized) {
            return;
        }

        if (!this.mapInitialized) {
            this.buildWorldBounds(state.roadMap);
            this.mapInitialized = true;
        }

        this.resizeViewport();

        this.clampCamera();

        this.world.position.set(-this.cameraX, -this.cameraY);

        this.renderWorld(state);
    }

    destroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;

        this.removePointerHandlers();

        if (this.app) {
            this.app.destroy();
        }

        this.world = undefined as never;
        this.app = undefined as never;

        this.container.replaceChildren();

        this.initialized = false;
        this.mapInitialized = false;
    }

    private createScene(): void {
        this.scene = document.createElement('div');

        this.scene.className = 'scene';

        this.scene.style.position = 'relative';
        this.scene.style.width = '100%';
        this.scene.style.height = '100%';
        this.scene.style.overflow = 'hidden';
        this.scene.style.borderRadius = '16px';
        this.scene.style.border = '1px solid #475569';

        this.scene.style.touchAction = 'none';
        this.scene.style.userSelect = 'none';

        this.container.replaceChildren(this.scene);
    }

    private resizeViewport(): void {
        if (!this.app || !this.scene) {
            return;
        }

        const width = Math.max(1, Math.floor(this.scene.clientWidth));

        const height = Math.max(1, Math.floor(this.scene.clientHeight));

        if (this.app.renderer.width !== width || this.app.renderer.height !== height) {
            this.app.renderer.resize(width, height);
        }
    }

    private buildWorldBounds(roadMap: RoadMap): void {
        const nodes = roadMap.getNodes();

        if (nodes.length === 0) {
            this.worldBounds = {
                minX: 0,
                minY: 0,
                maxX: 1,
                maxY: 1,
                width: 1,
                height: 1,
            };

            return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const node of nodes) {
            const position = node.getPosition();

            minX = Math.min(minX, position.x);

            minY = Math.min(minY, position.y);

            maxX = Math.max(maxX, position.x);

            maxY = Math.max(maxY, position.y);
        }

        this.worldBounds = {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX + this.padding * 2,
            height: maxY - minY + this.padding * 2,
        };
    }

    private renderWorld(state: RenderState): void {
        this.world.removeChildren();

        this.renderRoads(state.roadMap);

        for (const trafficLight of state.trafficLights) {
            this.renderTrafficLight(trafficLight);
        }

        for (const vehicle of state.vehicles) {
            this.renderVehicle(vehicle);
        }

        this.app.render();
    }

    private renderRoads(roadMap: RoadMap): void {
        const viewport = this.getViewportBounds();

        for (const road of roadMap.getRoads()) {
            const start = this.getWorldPosition(road.getNodeA().getPosition());

            const end = this.getWorldPosition(road.getNodeB().getPosition());

            if (
                !this.intersectsRoadViewport(
                    start.x,
                    start.y,
                    end.x,
                    end.y,
                    this.roadWidth / 2,
                    viewport,
                )
            ) {
                continue;
            }

            this.renderRoad(road, start.x, start.y, end.x, end.y);

            this.renderLaneDivider(start.x, start.y, end.x, end.y);
        }
    }

    private renderRoad(
        road: Road,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
    ): void {
        void road;

        const dx = endX - startX;
        const dy = endY - startY;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const angle = Math.atan2(dy, dx);

        const extension = this.roadWidth / 2;

        const roadLength = length + extension * 2;

        const roadStartX = startX - Math.cos(angle) * extension;

        const roadStartY = startY - Math.sin(angle) * extension;

        const graphics = new Graphics();

        graphics.rect(0, -this.roadWidth / 2, roadLength, this.roadWidth).fill(COLORS.road);

        graphics.position.set(roadStartX, roadStartY);

        graphics.rotation = angle;

        this.world.addChild(graphics);
    }

    private renderLaneDivider(startX: number, startY: number, endX: number, endY: number): void {
        const dx = endX - startX;
        const dy = endY - startY;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const angle = Math.atan2(dy, dx);

        const divider = new Graphics();

        const dashLength = 10;
        const gapLength = 10;

        for (let x = 0; x < length; x += dashLength + gapLength) {
            const visibleLength = Math.min(dashLength, length - x);

            divider.rect(x, -0.5, visibleLength, 1).fill({
                color: COLORS.laneDivider,
                alpha: 0.8,
            });
        }

        divider.position.set(startX, startY);

        divider.rotation = angle;

        this.world.addChild(divider);
    }

    private renderTrafficLight(light: TrafficLightRenderState): void {
        const position = this.getWorldPosition(light.position);

        if (!this.isPointVisible(position.x, position.y)) {
            return;
        }

        const container = new Container();

        container.position.set(position.x, position.y);

        const housingWidth = 18;
        const housingHeight = 38;
        const housingRadius = 5;

        const housing = new Graphics();

        housing
            .roundRect(
                -housingWidth / 2,
                -housingHeight / 2,
                housingWidth,
                housingHeight,
                housingRadius,
            )
            .fill(COLORS.housing)
            .stroke({
                color: COLORS.housingBorder,
                width: 1,
            });

        const lampRadius = 4;
        const lampSpacing = 10;

        const redLamp = this.createLamp(0, -lampSpacing, COLORS.red, light.color === 'red');

        const yellowLamp = this.createLamp(0, 0, COLORS.yellow, light.color === 'yellow');

        const greenLamp = this.createLamp(0, lampSpacing, COLORS.green, light.color === 'green');

        container.addChild(housing, redLamp, yellowLamp, greenLamp);

        const timer = new Text({
            text: `${(light.remainingTime / 1000).toFixed(1)}s`,

            style: {
                fill: COLORS.text,
                fontSize: 10,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
        });

        timer.anchor.set(0, 0.5);

        timer.position.set(housingWidth / 2 + 5, 0);

        container.addChild(timer);

        this.world.addChild(container);
    }

    private createLamp(x: number, y: number, color: number, active: boolean): Graphics {
        const lamp = new Graphics();

        lamp.circle(0, 0, 4).fill({
            color,
            alpha: active ? 1 : 0.18,
        });

        if (active) {
            lamp.circle(0, 0, 6).fill({
                color,
                alpha: 0.14,
            });
        }

        lamp.position.set(x, y);

        return lamp;
    }

    private renderVehicle(vehicle: VehicleState): void {
        const position = this.getWorldPosition(vehicle.position);

        const margin = Math.max(this.vehicleLength, this.vehicleWidth);

        if (!this.isPointVisible(position.x, position.y, margin)) {
            return;
        }

        const graphics = new Graphics();

        graphics
            .roundRect(
                -this.vehicleLength / 2,
                -this.vehicleWidth / 2,
                this.vehicleLength,
                this.vehicleWidth,
                3,
            )
            .fill(COLORS.vehicle)
            .stroke({
                color: COLORS.vehicleBorder,
                width: 1,
            });

        graphics.position.set(position.x, position.y);

        graphics.rotation = vehicle.angle;

        this.world.addChild(graphics);
    }

    private getWorldPosition(position: { x: number; y: number }): {
        x: number;
        y: number;
    } {
        return {
            x: position.x - this.worldBounds.minX + this.padding,

            y: position.y - this.worldBounds.minY + this.padding,
        };
    }

    private getViewportBounds(): Bounds {
        const width = this.app?.renderer.width ?? 1;

        const height = this.app?.renderer.height ?? 1;

        return {
            minX: this.cameraX,
            minY: this.cameraY,
            maxX: this.cameraX + width,
            maxY: this.cameraY + height,
            width,
            height,
        };
    }

    private isPointVisible(x: number, y: number, margin = 0): boolean {
        const viewport = this.getViewportBounds();

        return (
            x >= viewport.minX - margin &&
            x <= viewport.maxX + margin &&
            y >= viewport.minY - margin &&
            y <= viewport.maxY + margin
        );
    }

    private intersectsRoadViewport(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        margin: number,
        viewport: Bounds,
    ): boolean {
        const minX = Math.min(startX, endX) - margin;

        const maxX = Math.max(startX, endX) + margin;

        const minY = Math.min(startY, endY) - margin;

        const maxY = Math.max(startY, endY) + margin;

        return !(
            maxX < viewport.minX ||
            minX > viewport.maxX ||
            maxY < viewport.minY ||
            minY > viewport.maxY
        );
    }

    private clampCamera(): void {
        const viewportWidth = this.app?.renderer.width ?? 1;

        const viewportHeight = this.app?.renderer.height ?? 1;

        const maxCameraX = Math.max(0, this.worldBounds.width - viewportWidth);

        const maxCameraY = Math.max(0, this.worldBounds.height - viewportHeight);

        this.cameraX = Math.max(0, Math.min(this.cameraX, maxCameraX));

        this.cameraY = Math.max(0, Math.min(this.cameraY, maxCameraY));
    }

    private attachPointerHandlers(): void {
        this.scene.addEventListener('pointerdown', this.handlePointerDown);

        this.scene.addEventListener('pointermove', this.handlePointerMove);

        this.scene.addEventListener('pointerup', this.handlePointerUp);

        this.scene.addEventListener('pointercancel', this.handlePointerUp);

        this.scene.addEventListener('pointerleave', this.handlePointerUp);
    }

    private removePointerHandlers(): void {
        if (!this.scene) {
            return;
        }

        this.scene.removeEventListener('pointerdown', this.handlePointerDown);

        this.scene.removeEventListener('pointermove', this.handlePointerMove);

        this.scene.removeEventListener('pointerup', this.handlePointerUp);

        this.scene.removeEventListener('pointercancel', this.handlePointerUp);

        this.scene.removeEventListener('pointerleave', this.handlePointerUp);
    }

    private readonly handlePointerDown = (event: PointerEvent): void => {
        this.dragging = true;

        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;

        this.dragCameraX = this.cameraX;
        this.dragCameraY = this.cameraY;

        this.scene.setPointerCapture?.(event.pointerId);
    };

    private readonly handlePointerMove = (event: PointerEvent): void => {
        if (!this.dragging) {
            return;
        }

        const dx = event.clientX - this.dragStartX;

        const dy = event.clientY - this.dragStartY;

        this.cameraX = this.dragCameraX - dx;

        this.cameraY = this.dragCameraY - dy;

        this.clampCamera();
    };

    private readonly handlePointerUp = (event: PointerEvent): void => {
        this.dragging = false;

        if (this.scene.hasPointerCapture?.(event.pointerId)) {
            this.scene.releasePointerCapture?.(event.pointerId);
        }
    };
}
