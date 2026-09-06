import { Lane } from './lane';
import { Road } from './road';
import { RoadNode } from './road-node';
import { NodeType } from './node-type';
import { RoadMap } from './road-map';
import { Vector2 } from '@shared/utils/math/vector2';
import type { GridConfig } from '@shared/config/grid-config';

export class GridGenerator {
    private readonly config: GridConfig;

    constructor(config: GridConfig) {
        this.config = config;
    }

    /**
     * Generates a random road map
     */
    generate(): RoadMap {
        const nodes = this.createNodes();

        const roads: Road[] = [];
        const lanes: Lane[] = [];

        this.createHorizontalRoads(nodes, roads, lanes);
        this.createVerticalRoads(nodes, roads, lanes);

        return new RoadMap(nodes, roads, lanes);
    }

    /**
     * Generates intersections for every row and column on the map
     */
    private createNodes(): RoadNode[] {
        const nodes: RoadNode[] = [];

        let id = 0;

        for (let row = 0; row < this.config.rows; row++) {
            for (let column = 0; column < this.config.columns; column++) {
                const position = new Vector2(
                    column * this.config.blockSize,
                    row * this.config.blockSize,
                );

                const type = this.getNodeType(row, column);

                nodes.push(new RoadNode(id++, position, type));
            }
        }

        return nodes;
    }

    /**
     * Determines the type of node based on its position in a grid
     */
    private getNodeType(row: number, column: number): NodeType {
        const isTop = row === 0;
        const isBottom = row === this.config.rows - 1;

        const isLeft = column === 0;
        const isRight = column === this.config.columns - 1;

        const isCorner = (isTop || isBottom) && (isLeft || isRight);

        if (isCorner) {
            return NodeType.Corner;
        }

        const isEdge = isTop || isBottom || isLeft || isRight;

        if (isEdge) {
            return NodeType.TJunction;
        }

        return NodeType.FourWayIntersection;
    }

    /**
     * Generates the horizontal roads for all given nodes
     */
    private createHorizontalRoads(nodes: RoadNode[], roads: Road[], lanes: Lane[]): void {
        for (let row = 0; row < this.config.rows; row++) {
            for (let column = 0; column < this.config.columns - 1; column++) {
                const nodeA = this.getNode(nodes, row, column);
                const nodeB = this.getNode(nodes, row, column + 1);

                const road = this.createRoad(nodeA, nodeB, roads.length, lanes);

                roads.push(road);
            }
        }
    }

    /**
     * Generates the vertical roads for all given nodes
     */
    private createVerticalRoads(nodes: RoadNode[], roads: Road[], lanes: Lane[]): void {
        for (let row = 0; row < this.config.rows - 1; row++) {
            for (let column = 0; column < this.config.columns; column++) {
                const nodeA = this.getNode(nodes, row, column);
                const nodeB = this.getNode(nodes, row + 1, column);

                const road = this.createRoad(nodeA, nodeB, roads.length, lanes);

                roads.push(road);
            }
        }
    }

    /**
     * Creates a two-way road between two nodes
     */
    private createRoad(nodeA: RoadNode, nodeB: RoadNode, roadId: number, lanes: Lane[]): Road {
        const road = new Road(roadId, nodeA, nodeB);

        const laneOffset = this.config.laneWidth / 2;

        const forwardLane = new Lane(lanes.length, nodeA, nodeB, road, laneOffset);
        road.addForwardLane(forwardLane);
        lanes.push(forwardLane);

        const backwardLane = new Lane(lanes.length, nodeB, nodeA, road, laneOffset);
        road.addBackwardLane(backwardLane);
        lanes.push(backwardLane);

        nodeA.addRoad(road);
        nodeB.addRoad(road);

        return road;
    }

    /**
     * Gets a node from a flattened node array
     */
    private getNode(nodes: RoadNode[], row: number, column: number): RoadNode {
        const index = row * this.config.columns + column;

        return nodes[index];
    }
}
