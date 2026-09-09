import type { Lane } from './lane';
import type { RoadNode } from './road-node';

export class Road {
    private readonly id: number;
    private readonly nodeA: RoadNode;
    private readonly nodeB: RoadNode;
    private readonly forwardLanes: Lane[] = [];
    private readonly backwardLanes: Lane[] = [];

    getId(): number {
        return this.id;
    }

    getNodeA(): RoadNode {
        return this.nodeA;
    }

    getNodeB(): RoadNode {
        return this.nodeB;
    }

    getForwardLanes(): readonly Lane[] {
        return this.forwardLanes;
    }

    getBackwardLanes(): readonly Lane[] {
        return this.backwardLanes;
    }

    constructor(id: number, nodeA: RoadNode, nodeB: RoadNode) {
        this.id = id;
        this.nodeA = nodeA;
        this.nodeB = nodeB;
    }

    addForwardLane(lane: Lane): void {
        this.forwardLanes.push(lane);
    }

    addBackwardLane(lane: Lane): void {
        this.backwardLanes.push(lane);
    }
}
