import type { Intersection } from './intersection';
import type { Road } from './road';
import type { Lane } from './lane';

/**
 * Represents the state of the whole map containing all the lanes, roads and intersections
 */
export class RoadMap {
    private readonly intersections: Intersection[];
    private readonly roads: Road[];
    private readonly lanes: Lane[];

    constructor(intersections: Intersection[], roads: Road[], lanes: Lane[]) {
        this.intersections = intersections;
        this.roads = roads;
        this.lanes = lanes;
    }

    getIntersections(): Intersection[] {
        return this.intersections;
    }

    getRoads(): Road[] {
        return this.roads;
    }

    getLanes(): Lane[] {
        return this.lanes;
    }

    /**
     * Returns the intersection with given id on the map
     *
     * @param {number} id - Intersection with this id to look for
     */
    getIntersection(id: number): Intersection | undefined {
        return this.intersections.find((intersection) => intersection.getId() === id);
    }

    /**
     * Returns the road with the given id on the map
     *
     * @param {number} id - Road with this id to look for
     */
    getRoad(id: number): Road | undefined {
        return this.roads.find((road) => road.getId() === id);
    }

    /**
     * Returns the lnae with the given id on the map
     *
     * @param {number} id - Lane with this id to look for
     */
    getLane(id: number): Lane | undefined {
        return this.lanes.find((lane) => lane.getId() === id);
    }
}
