import type { Road } from './road';
import type { Lane } from './lane';
import type { RoadNode } from './road-node';

/**
 * Represents the state of the whole map containing all nodes, lanes and roads
 */
export class RoadMap {
    private readonly nodes: RoadNode[];
    private readonly lanes: Lane[];
    private readonly roads: Road[];

    constructor(nodes: RoadNode[], roads: Road[], lanes: Lane[]) {
        this.nodes = nodes;
        this.roads = roads;
        this.lanes = lanes;
    }

    getNodes(): readonly RoadNode[] {
        return this.nodes;
    }

    getLanes(): readonly Lane[] {
        return this.lanes;
    }

    getRoads(): readonly Road[] {
        return this.roads;
    }

    /**
     * Returns the road node with given id on the map
     *
     * @param {number} id - Road node with this id to look for
     */
    getNode(id: number): RoadNode | undefined {
        return this.nodes.find((node) => node.getId() === id);
    }

    /**
     * Returns the lnae with the given id on the map
     *
     * @param {number} id - Lane with this id to look for
     */
    getLane(id: number): Lane | undefined {
        return this.lanes.find((lane) => lane.getId() === id);
    }

    /**
     * Returns the road with the given id on the map
     *
     * @param {number} id - Road with this id to look for
     */
    getRoad(id: number): Road | undefined {
        return this.roads.find((road) => road.getId() === id);
    }
}
