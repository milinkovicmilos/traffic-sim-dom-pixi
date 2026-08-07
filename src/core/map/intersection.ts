import type { Vector2 } from '@shared/utils/math/vector2';
import type { Road } from './road';

export class Intersection {
    private readonly id: number;
    private readonly position: Vector2;
    private readonly incomingRoads: Road[];
    private readonly outgoingRoads: Road[];

    constructor(id: number, position: Vector2) {
        this.id = id;
        this.position = position;
    }

    getId(): number {
        return this.id;
    }

    getPosition(): Vector2 {
        return this.position;
    }

    /**
     * Add incoming road to the intersection
     */
    addIncomingRoad(road: Road): void {
        this.incomingRoads.push(road);
    }

    /**
     * Add outgoing road to the intersection
     */
    addOutgoingRoad(road: Road): void {
        this.outgoingRoads.push(road);
    }
}
