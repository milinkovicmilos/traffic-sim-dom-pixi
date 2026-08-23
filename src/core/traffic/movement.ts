import type { Lane } from '@core/map/lane';
import type { RoadNode } from '@core/map/road-node';

export class Movement {
    private readonly incomingLane: Lane;
    private readonly outgoingLane: Lane;

    constructor(incomingLane: Lane, outgoingLane: Lane) {
        // Check if the lanes start/end in the same node
        if (incomingLane.getEndNode() !== outgoingLane.getStartNode()) {
            throw new Error('Incoming and outgoing lanes must be a part of the same road node.');
        }

        this.incomingLane = incomingLane;
        this.outgoingLane = outgoingLane;
    }

    getIncomingLane(): Lane {
        return this.incomingLane;
    }

    getOutgoingLane(): Lane {
        return this.outgoingLane;
    }

    /**
     * Returns the node at which the lanes are intersecting
     */
    getNode(): RoadNode {
        return this.incomingLane.getEndNode();
    }
}
