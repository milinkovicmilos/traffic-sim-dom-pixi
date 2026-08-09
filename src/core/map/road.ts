import type { Lane } from './lane';
import type { RoadNode } from './road-node';

export class Road {
    private readonly id: number;
    private readonly nodeA: RoadNode;
    private readonly nodeB: RoadNode;
    private readonly forwardLane: Lane;
    private readonly backwardLane: Lane;

    getId(): number {
        return this.id;
    }

    getNodeA(): RoadNode {
        return this.nodeA;
    }

    getNodeB(): RoadNode {
        return this.nodeB;
    }

    getFordwardLane(): Lane {
        return this.forwardLane;
    }

    getBackwardLane(): Lane {
        return this.backwardLane;
    }

    constructor(
        id: number,
        nodeA: RoadNode,
        nodeB: RoadNode,
        forwardLane: Lane,
        backwardLane: Lane,
    ) {
        this.id = id;
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.forwardLane = forwardLane;
        this.backwardLane = backwardLane;
    }
}
