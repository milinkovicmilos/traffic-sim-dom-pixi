import type { Lane } from '@core/map/lane';

export class Movement {
    private readonly incomingLane: Lane;
    private readonly outgoingLane: Lane;

    constructor(incomingLane: Lane, outgoingLane: Lane) {
        this.incomingLane = incomingLane;
        this.outgoingLane = outgoingLane;
    }

    getIncomingLane(): Lane {
        return this.incomingLane;
    }

    getOutgoingLane(): Lane {
        return this.outgoingLane;
    }
}
