import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

import type { RoadMap } from '@core/map/road-map';
import { Vector2 } from '@shared/utils/math/vector2';
import type { Renderer, RenderState } from '@rendering/renderer';

export interface PixiRendererOptions {
    container: HTMLElement;
    padding: number;
    roadWidth: number;
    vehicleLength: number;
    vehicleWidth: number;
}

interface WorldBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

interface Viewport {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export class PixiRenderer implements Renderer {
    private readonly container: HTMLElement;
    private readonly padding: number;
    private readonly roadWidth: number;
    private readonly vehicleLength: number;
    private readonly vehicleWidth: number;

    private app: Application | null = null;
    private scene: HTMLElement | null = null;
    private world: Container | null = null;

    private resizeObserver: ResizeObserver | null = null;

    private worldBounds: WorldBounds | null = null;

    private cameraX = 0;
    private cameraY = 0;

    private isDragging = false;
    private dragPointerId: number | null = null;

    private dragStartX = 0;
    private dragStartY = 0;

    private cameraStartX = 0;
    private cameraStartY = 0;

    private readonly trafficLightTimerStyle = new TextStyle({
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 10,
        fill: '#e5e7eb',
    });

    public constructor(options: PixiRendererOptions) {
        this.container = options.container;
        this.padding = options.padding;
        this.roadWidth = options.roadWidth;
        this.vehicleLength = options.vehicleLength;
        this.vehicleWidth = options.vehicleWidth;
    }

    public async initialize(): Promise<void> {
        this.destroy();

        /*
         * =========================================================
         * VIEWPORT
         * =========================================================
         */

        this.scene = document.createElement('div');

        this.scene.className = 'scene';

        /*
         * The DOM scene is the viewport.
         *
         * Pixi handles all camera movement itself, so the scene
         * must not scroll.
         */
        this.scene.style.position = 'relative';
        this.scene.style.overflow = 'hidden';
        this.scene.style.width = '100%';
        this.scene.style.height = '100%';

        this.scene.style.touchAction = 'none';
        this.scene.style.userSelect = 'none';

        this.container.replaceChildren(this.scene);

        /*
         * =========================================================
         * PIXI APPLICATION
         * =========================================================
         */

        const app = new Application();

        await app.init({
            width: 1,
            height: 1,

            backgroundAlpha: 0,

            antialias: true,

            preference: 'webgl',

            autoStart: false,
        });

        this.app = app;

        /*
         * This container represents the complete visible part
         * of the simulation world.
         *
         * The camera moves this container.
         */
        this.world = new Container();

        app.stage.addChild(this.world);

        /*
         * =========================================================
         * CANVAS
         * =========================================================
         *
         * Absolutely positioned so it never contributes its
         * simulation/world dimensions to DOM layout.
         */
        const canvas = app.canvas;

        canvas.style.position = 'absolute';

        canvas.style.left = '0';
        canvas.style.top = '0';

        canvas.style.width = '100%';

        canvas.style.height = '100%';

        canvas.style.display = 'block';

        /*
         * Input is handled by the scene element rather than
         * the canvas.
         */
        canvas.style.pointerEvents = 'none';

        this.scene.appendChild(canvas);

        /*
         * =========================================================
         * INPUT
         * =========================================================
         */

        this.attachPointerHandlers();

        /*
         * =========================================================
         * RESIZE
         * =========================================================
         */

        this.resizeObserver = new ResizeObserver(() => {
            this.resizeViewport();
        });

        this.resizeObserver.observe(this.scene);

        this.resizeViewport();
    }

    public render(state: RenderState): void {
        if (!this.app || !this.world || !this.scene) {
            return;
        }

        /*
         * Calculate the simulation's world bounds.
         */
        this.worldBounds = this.calculateWorldBounds(state.roadMap);

        /*
         * Make sure the current camera is still legal.
         */
        this.clampCamera();

        /*
         * The canvas always equals the viewport.
         */
        this.resizeViewport();

        /*
         * Current visible simulation rectangle.
         */
        const viewport = this.getVisibleWorldRect();

        /*
         * =========================================================
         * CAMERA
         * =========================================================
         *
         * The simulation coordinates are untouched.
         *
         * We move the rendering world instead.
         */
        this.world.position.set(-viewport.left, -viewport.top);

        /*
         * =========================================================
         * CLEAR PREVIOUS RENDER OBJECTS
         * =========================================================
         */

        const children = this.world.removeChildren();

        for (const child of children) {
            child.destroy();
        }

        /*
         * =========================================================
         * RENDER VISIBLE OBJECTS
         * =========================================================
         */

        this.renderRoads(state.roadMap, viewport);

        this.renderTrafficLights(state.trafficLights, viewport);

        this.renderVehicles(state.vehicles, viewport);

        this.app.render();
    }

    public destroy(): void {
        this.detachPointerHandlers();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.app) {
            this.app.destroy(true, {
                children: true,
            });

            this.app = null;
        }

        this.world = null;
        this.worldBounds = null;

        if (this.scene) {
            this.scene.remove();
            this.scene = null;
        }

        this.cameraX = 0;
        this.cameraY = 0;

        this.isDragging = false;
        this.dragPointerId = null;
    }

    /*
     * =============================================================
     * VIEWPORT
     * =============================================================
     */

    private resizeViewport(): void {
        if (!this.app || !this.scene) {
            return;
        }

        const width = Math.max(1, this.scene.clientWidth);

        const height = Math.max(1, this.scene.clientHeight);

        this.app.renderer.resize(width, height);

        this.app.canvas.style.position = 'absolute';

        this.app.canvas.style.left = '0';

        this.app.canvas.style.top = '0';

        this.app.canvas.style.width = '100%';

        this.app.canvas.style.height = '100%';

        this.app.canvas.style.display = 'block';

        this.clampCamera();
    }

    private getVisibleWorldRect(): Viewport {
        const width = this.scene?.clientWidth ?? 0;

        const height = this.scene?.clientHeight ?? 0;

        return {
            left: this.cameraX,
            top: this.cameraY,

            right: this.cameraX + width,

            bottom: this.cameraY + height,
        };
    }

    /*
     * =============================================================
     * WORLD BOUNDS
     * =============================================================
     */

    private calculateWorldBounds(roadMap: RoadMap): WorldBounds {
        const nodes = roadMap.getNodes();

        if (nodes.length === 0) {
            return {
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0,
                width: this.padding * 2,
                height: this.padding * 2,
            };
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

        return {
            minX,
            minY,
            maxX,
            maxY,

            width: maxX - minX + this.padding * 2,

            height: maxY - minY + this.padding * 2,
        };
    }

    private getWorldPosition(position: Vector2): Vector2 {
        if (!this.worldBounds) {
            return new Vector2(position.x + this.padding, position.y + this.padding);
        }

        return new Vector2(
            position.x - this.worldBounds.minX + this.padding,
            position.y - this.worldBounds.minY + this.padding,
        );
    }

    /*
     * =============================================================
     * CULLING
     * =============================================================
     */

    private isPointVisible(position: Vector2, viewport: Viewport, padding = 0): boolean {
        return (
            position.x + padding >= viewport.left &&
            position.x - padding <= viewport.right &&
            position.y + padding >= viewport.top &&
            position.y - padding <= viewport.bottom
        );
    }

    private isSegmentVisible(
        start: Vector2,
        end: Vector2,
        viewport: Viewport,
        padding: number,
    ): boolean {
        const minX = Math.min(start.x, end.x) - padding;

        const maxX = Math.max(start.x, end.x) + padding;

        const minY = Math.min(start.y, end.y) - padding;

        const maxY = Math.max(start.y, end.y) + padding;

        return !(
            maxX < viewport.left ||
            minX > viewport.right ||
            maxY < viewport.top ||
            minY > viewport.bottom
        );
    }

    /*
     * =============================================================
     * ROADS
     * =============================================================
     */

    private renderRoads(roadMap: RoadMap, viewport: Viewport): void {
        if (!this.world) {
            return;
        }

        for (const road of roadMap.getRoads()) {
            /*
             * IMPORTANT:
             *
             * A Road is rendered once.
             *
             * We do NOT render every lane as a road surface.
             *
             * That prevents the staggered "teeth" at intersections
             * and at the edges of the map.
             */
            const start = road.getNodeA().getPosition();

            const end = road.getNodeB().getPosition();

            this.renderRoad(start, end, viewport);

            this.renderLaneDivider(start, end, viewport);
        }
    }

    private renderRoad(start: Vector2, end: Vector2, viewport: Viewport): void {
        if (!this.world) {
            return;
        }

        const worldStart = this.getWorldPosition(start);

        const worldEnd = this.getWorldPosition(end);

        /*
         * Cull the whole road before creating the Graphics object.
         */
        if (!this.isSegmentVisible(worldStart, worldEnd, viewport, this.roadWidth / 2)) {
            return;
        }

        const dx = worldEnd.x - worldStart.x;

        const dy = worldEnd.y - worldStart.y;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const angle = Math.atan2(dy, dx);

        /*
         * Extend the road by half its width at both endpoints.
         *
         * Because this is ONE rectangle, the ends remain square.
         */
        const extension = this.roadWidth / 2;

        const startX = worldStart.x - Math.cos(angle) * extension;

        const startY = worldStart.y - Math.sin(angle) * extension;

        const graphics = new Graphics();

        graphics.rect(0, -this.roadWidth / 2, length + this.roadWidth, this.roadWidth).fill({
            color: 0x3f444b,
        });

        graphics.position.set(startX, startY);

        graphics.rotation = angle;

        this.world.addChild(graphics);
    }

    private renderLaneDivider(start: Vector2, end: Vector2, viewport: Viewport): void {
        if (!this.world) {
            return;
        }

        const worldStart = this.getWorldPosition(start);

        const worldEnd = this.getWorldPosition(end);

        if (!this.isSegmentVisible(worldStart, worldEnd, viewport, 2)) {
            return;
        }

        const dx = worldEnd.x - worldStart.x;

        const dy = worldEnd.y - worldStart.y;

        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return;
        }

        const rotation = Math.atan2(dy, dx);

        const divider = new Graphics();

        /*
         * Same pattern as the DOM:
         *
         * 10px visible
         * 10px gap
         */
        const dashLength = 10;
        const gapLength = 10;
        const step = dashLength + gapLength;

        for (let distance = 0; distance < length; distance += step) {
            const currentLength = Math.min(dashLength, length - distance);

            divider.rect(distance, -0.5, currentLength, 1).fill({
                color: 0xd6d3d1,
                alpha: 0.8,
            });
        }

        divider.position.set(worldStart.x, worldStart.y);

        divider.rotation = rotation;

        this.world.addChild(divider);
    }

    /*
     * =============================================================
     * TRAFFIC LIGHTS
     * =============================================================
     */

    private renderTrafficLights(
        trafficLights: RenderState['trafficLights'],
        viewport: Viewport,
    ): void {
        if (!this.world) {
            return;
        }

        for (const light of trafficLights) {
            const position = this.getWorldPosition(light.position);

            /*
             * Cull lights outside the viewport.
             */
            if (!this.isPointVisible(position, viewport, 25)) {
                continue;
            }

            this.renderTrafficLight(light, position);
        }
    }

    private renderTrafficLight(
        light: RenderState['trafficLights'][number],
        position: Vector2,
    ): void {
        if (!this.world) {
            return;
        }

        const container = new Container();

        container.position.set(position.x, position.y);

        /*
         * =========================================================
         * LIGHT HOUSING
         * =========================================================
         *
         * Matches the DOM:
         *
         * background: #111827
         * border: 1px solid #374151
         * border-radius: 5px
         * padding: 4px
         */
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
            .fill({
                color: 0x111827,
            })
            .stroke({
                color: 0x374151,
                width: 1,
            });

        /*
         * Same approximate vertical arrangement as the DOM:
         *
         * 8px lamp
         * 3px gap
         * 8px lamp
         * 3px gap
         * 8px lamp
         */
        const lampRadius = 4;
        const lampSpacing = 10;

        /*
         * ---------------------------------------------------------
         * RED
         * ---------------------------------------------------------
         */

        const redLamp = new Graphics();

        redLamp.circle(0, -lampSpacing, lampRadius).fill({
            color: 0xef4444,
            alpha: light.color === 'red' ? 1 : 0.18,
        });

        /*
         * ---------------------------------------------------------
         * YELLOW
         * ---------------------------------------------------------
         */

        const yellowLamp = new Graphics();

        yellowLamp.circle(0, 0, lampRadius).fill({
            color: 0xf59e0b,
            alpha: light.color === 'yellow' ? 1 : 0.18,
        });

        /*
         * ---------------------------------------------------------
         * GREEN
         * ---------------------------------------------------------
         */

        const greenLamp = new Graphics();

        greenLamp.circle(0, lampSpacing, lampRadius).fill({
            color: 0x22c55e,
            alpha: light.color === 'green' ? 1 : 0.18,
        });

        /*
         * Active-lamp glow.
         *
         * This approximates the DOM's
         * box-shadow: 0 0 8px currentColor.
         */
        this.addTrafficLightGlow(
            light.color === 'red',
            0xef4444,
            redLamp,
            -lampSpacing,
            lampRadius,
        );

        this.addTrafficLightGlow(light.color === 'yellow', 0xf59e0b, yellowLamp, 0, lampRadius);

        this.addTrafficLightGlow(
            light.color === 'green',
            0x22c55e,
            greenLamp,
            lampSpacing,
            lampRadius,
        );

        container.addChild(housing, redLamp, yellowLamp, greenLamp);

        /*
         * =========================================================
         * TIMER
         * =========================================================
         *
         * DOM:
         *
         * left: calc(100% + 5px)
         * top: 50%
         * transform: translateY(-50%)
         */
        const timer = new Text({
            text: `${(light.remainingTime / 1000).toFixed(1)}s`,
            style: this.trafficLightTimerStyle,
        });

        timer.anchor.set(0, 0.5);

        timer.position.set(housingWidth / 2 + 5, 0);

        container.addChild(timer);

        this.world.addChild(container);
    }

    private addTrafficLightGlow(
        active: boolean,
        color: number,
        lamp: Graphics,
        y: number,
        radius: number,
    ): void {
        if (!active) {
            return;
        }

        /*
         * A soft larger transparent circle gives the active
         * lamp a Pixi equivalent to the DOM box-shadow.
         */
        const glow = new Graphics();

        glow.circle(0, y, radius + 3).fill({
            color,
            alpha: 0.15,
        });

        /*
         * Put the glow behind the lamp itself.
         */
        lamp.parent?.addChildAt(glow, Math.max(0, lamp.parent.children.indexOf(lamp)));
    }

    /*
     * =============================================================
     * VEHICLES
     * =============================================================
     */

    private renderVehicles(vehicles: RenderState['vehicles'], viewport: Viewport): void {
        if (!this.world) {
            return;
        }

        const cullingPadding = Math.max(this.vehicleLength, this.vehicleWidth);

        for (const vehicle of vehicles) {
            const position = this.getWorldPosition(vehicle.position);

            if (!this.isPointVisible(position, viewport, cullingPadding)) {
                continue;
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
                .fill({
                    color: 0x38bdf8,
                })
                .stroke({
                    color: 0xe0f2fe,
                    width: 1,
                });

            graphics.position.set(position.x, position.y);

            graphics.rotation = vehicle.angle;

            this.world.addChild(graphics);
        }
    }

    /*
     * =============================================================
     * CAMERA
     * =============================================================
     */

    private clampCamera(): void {
        if (!this.scene || !this.worldBounds) {
            return;
        }

        const viewportWidth = this.scene.clientWidth;

        const viewportHeight = this.scene.clientHeight;

        const maxCameraX = Math.max(0, this.worldBounds.width - viewportWidth);

        const maxCameraY = Math.max(0, this.worldBounds.height - viewportHeight);

        this.cameraX = Math.max(0, Math.min(this.cameraX, maxCameraX));

        this.cameraY = Math.max(0, Math.min(this.cameraY, maxCameraY));
    }

    /*
     * =============================================================
     * POINTER DRAGGING
     * =============================================================
     */

    private attachPointerHandlers(): void {
        if (!this.scene) {
            return;
        }

        this.scene.addEventListener('pointerdown', this.handlePointerDown);

        this.scene.addEventListener('pointermove', this.handlePointerMove);

        this.scene.addEventListener('pointerup', this.handlePointerUp);

        this.scene.addEventListener('pointercancel', this.handlePointerUp);

        this.scene.addEventListener('lostpointercapture', this.handleLostPointerCapture);
    }

    private detachPointerHandlers(): void {
        if (!this.scene) {
            return;
        }

        this.scene.removeEventListener('pointerdown', this.handlePointerDown);

        this.scene.removeEventListener('pointermove', this.handlePointerMove);

        this.scene.removeEventListener('pointerup', this.handlePointerUp);

        this.scene.removeEventListener('pointercancel', this.handlePointerUp);

        this.scene.removeEventListener('lostpointercapture', this.handleLostPointerCapture);
    }

    private handlePointerDown = (event: PointerEvent): void => {
        if (!this.scene) {
            return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        this.isDragging = true;

        this.dragPointerId = event.pointerId;

        this.dragStartX = event.clientX;

        this.dragStartY = event.clientY;

        this.cameraStartX = this.cameraX;

        this.cameraStartY = this.cameraY;

        this.scene.setPointerCapture(event.pointerId);

        this.scene.classList.add('is-dragging');

        event.preventDefault();
    };

    private handlePointerMove = (event: PointerEvent): void => {
        if (!this.scene || !this.isDragging || this.dragPointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - this.dragStartX;

        const deltaY = event.clientY - this.dragStartY;

        this.cameraX = this.cameraStartX - deltaX;

        this.cameraY = this.cameraStartY - deltaY;

        this.clampCamera();

        event.preventDefault();
    };

    private handlePointerUp = (event: PointerEvent): void => {
        if (!this.scene || this.dragPointerId !== event.pointerId) {
            return;
        }

        this.stopDragging(event.pointerId);

        event.preventDefault();
    };

    private handleLostPointerCapture = (event: PointerEvent): void => {
        if (this.dragPointerId !== event.pointerId) {
            return;
        }

        this.stopDragging(event.pointerId);
    };

    private stopDragging(pointerId: number): void {
        if (!this.scene) {
            return;
        }

        this.isDragging = false;
        this.dragPointerId = null;

        if (this.scene.hasPointerCapture(pointerId)) {
            this.scene.releasePointerCapture(pointerId);
        }

        this.scene.classList.remove('is-dragging');
    }
}
