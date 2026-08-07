import type { GridConfig } from '@shared/config/grid-config';
import { RoadMap } from './road-map';
import { Intersection } from './intersection';
import { Vector2 } from '@shared/utils/math/vector2';
import { Road } from './road';
import { Lane } from './lane';

export class GridGenerator {
    private readonly config: GridConfig;

    constructor(config: GridConfig) {
        this.config = config;
    }

    /**
     * Generates a random road map
     */
    generate(): RoadMap {
        const intersections = this.createIntersections();

        const roads: Road[] = [];
        const lanes: Lane[] = [];

        this.createHorizontalRoads(intersections, roads, lanes);
        this.createVerticalRoads(intersections, roads, lanes);

        return new RoadMap(intersections, roads, lanes);
    }

    /**
     * Generates intersections for every row and column on the map
     */
    private createIntersections(): Intersection[] {
        const intersections: Intersection[] = [];

        let id = 0;

        for (let row = 0; row < this.config.rows; row++) {
            for (let column = 0; column < this.config.columns; column++) {
                const position = new Vector2(
                    column * this.config.blockSize,
                    row * this.config.blockSize,
                );

                intersections.push(new Intersection(id++, position));
            }
        }

        return intersections;
    }

    /**
     * Generates the horizontal roads for all given intersections
     */
    private createHorizontalRoads(
        intersections: Intersection[],
        roads: Road[],
        lanes: Lane[],
    ): void {
        for (let row = 0; row < this.config.rows; row++) {
            for (let column = 0; column < this.config.columns - 1; column++) {
                const intersectionA = this.getIntersection(intersections, row, column);
                const intersectionB = this.getIntersection(intersections, row, column + 1);

                const road = this.createRoad(intersectionA, intersectionB, roads.length, lanes);

                roads.push(road);
            }
        }
    }

    /**
     * Generates the vertical roads for all given intersections
     */
    private createVerticalRoads(intersections: Intersection[], roads: Road[], lanes: Lane[]): void {
        for (let row = 0; row < this.config.rows - 1; row++) {
            for (let column = 0; column < this.config.columns; column++) {
                const intersectionA = this.getIntersection(intersections, row, column);
                const intersectionB = this.getIntersection(intersections, row + 1, column);

                const road = this.createRoad(intersectionA, intersectionB, roads.length, lanes);

                roads.push(road);
            }
        }
    }

    private createRoad(
        intersectionA: Intersection,
        intersectionB: Intersection,
        roadId: number,
        lanes: Lane[],
    ): Road {
        const forwardLane = new Lane(lanes.length, intersectionA, intersectionB);
        lanes.push(forwardLane);

        const backwardLane = new Lane(lanes.length, intersectionB, intersectionA);
        lanes.push(backwardLane);

        const road = new Road(roadId, intersectionA, intersectionB, forwardLane, backwardLane);

        intersectionA.addRoad(road);
        intersectionB.addRoad(road);

        return road;
    }

    private getIntersection(
        intersections: Intersection[],
        row: number,
        column: number,
    ): Intersection {
        const index = row * this.config.columns + column;

        return intersections[index];
    }
}
