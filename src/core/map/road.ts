import type { Lane } from './lane';

export class Road {
    private lanes: Lane[];

    constructor(lanes: Lane[]) {
        this.lanes = lanes;
    }

    getLanes(): Lane[] {
        return this.lanes;
    }
}
