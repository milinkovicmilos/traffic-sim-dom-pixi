import type { RoadMap } from '@core/map/road-map';
import type { VehicleState } from '@core/vehicles/vehicle-state';
import type { Vector2 } from '@shared/utils/math/vector2';

export type TrafficLightColor = 'red' | 'yellow' | 'green';

export interface TrafficLightRenderState {
    key: string;
    nodeId: number;
    position: Vector2;
    color: TrafficLightColor;
    remainingTime: number;
}

export interface RenderState {
    roadMap: RoadMap;

    trafficLights: readonly TrafficLightRenderState[];

    vehicles: readonly VehicleState[];
}

export interface Renderer {
    initialize(): void | Promise<void>;

    render(state: RenderState): void;

    destroy(): void;
}
