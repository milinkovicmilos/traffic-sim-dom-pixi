import type { Vector2 } from '@shared/utils/math/vector2';
import type { Road } from './road';
import type { Lane } from './lane';

export class Intersection {
    private readonly id: number;
    private readonly position: Vector2;
    private readonly roads: Road[] = [];

    constructor(id: number, position: Vector2) {
        this.id = id;
        this.position = position;
    }

    equals(other: Intersection): boolean {
        return this.getPosition().equals(other.getPosition());
    }

    getId(): number {
        return this.id;
    }

    getPosition(): Vector2 {
        return this.position;
    }

    getRoads(): Road[] {
        return this.roads;
    }

    /**
     * Add a road to the intersection
     */
    addRoad(road: Road): void {
        this.roads.push(road);
    }

    /**
     * Returns the incoming lanes to this intersection as readonly array
     */
    getIncomingLanes(): readonly Lane[] {
        return this.roads
            .flatMap((road) => [road.getFordwardLane(), road.getBackwardLane()])
            .filter((lane) => lane.getEndIntersection() === this);
    }

    /**
     * Returns the outgoing lanes from this intersection as readonly array
     */
    getOutgoingLanes(): readonly Lane[] {
        return this.roads
            .flatMap((road) => [road.getFordwardLane(), road.getBackwardLane()])
            .filter((lane) => lane.getStartIntersection() === this);
    }
}
