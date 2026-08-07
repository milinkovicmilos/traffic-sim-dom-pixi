import type { Lane } from './lane';

export class Road {
    private readonly id: number;
    private readonly lanes: Lane[];

    constructor(id: number, lanes: Lane[]) {
        this.id = id;
        this.lanes = lanes;
    }

    getId(): number {
        return this.id;
    }

    getLanes(): Lane[] {
        return this.lanes;
    }
}
