import type { Intersection } from './intersection';
import type { Lane } from './lane';

export class Road {
    private readonly id: number;
    private readonly intersectionA: Intersection;
    private readonly intersectionB: Intersection;
    private readonly forwardLane: Lane;
    private readonly backwardLane: Lane;

    constructor(
        id: number,
        intersectionA: Intersection,
        intersectionB: Intersection,
        forwardLane: Lane,
        backwardLane: Lane,
    ) {
        this.id = id;
        this.intersectionA = intersectionA;
        this.intersectionB = intersectionB;
        this.forwardLane = forwardLane;
        this.backwardLane = backwardLane;
    }

    getId(): number {
        return this.id;
    }

    getIntersectionA(): Intersection {
        return this.intersectionA;
    }

    getIntersectionB(): Intersection {
        return this.intersectionB;
    }

    getFordwardLane(): Lane {
        return this.forwardLane;
    }

    getBackwardLane(): Lane {
        return this.backwardLane;
    }
}
