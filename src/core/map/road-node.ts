import type { Vector2 } from '@shared/utils/math/vector2';
import type { NodeType } from './node-type';
import type { Road } from './road';
import type { Lane } from './lane';

/**
 * A node in the grid that the roads are connected to
 */
export class RoadNode {
    private readonly id: number;
    private readonly position: Vector2;
    private readonly type: NodeType;

    private readonly roads: Road[] = [];

    getId(): number {
        return this.id;
    }

    getPosition(): Vector2 {
        return this.position;
    }

    getType(): NodeType {
        return this.type;
    }

    getRoads(): readonly Road[] {
        return this.roads;
    }

    constructor(id: number, position: Vector2, type: NodeType) {
        this.id = id;
        this.position = position;
        this.type = type;
    }

    equals(other: RoadNode): boolean {
        return this.getPosition().equals(other.getPosition());
    }

    /**
     * Assign a road to this node
     */
    addRoad(road: Road): void {
        this.roads.push(road);
    }

    /**
     * Returns the incoming lanes to this node as readonly array
     */
    getIncomingLanes(): readonly Lane[] {
        return this.roads
            .flatMap((road) => [road.getFordwardLane(), road.getBackwardLane()])
            .filter((lane) => lane.getEndNode() === this);
    }

    /**
     * Returns the outgoing lanes from this node as readonly array
     */
    getOutgoingLanes(): readonly Lane[] {
        return this.roads
            .flatMap((road) => [road.getFordwardLane(), road.getBackwardLane()])
            .filter((lane) => lane.getStartNode() === this);
    }
}
