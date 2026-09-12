import { RoadNode } from '@core/map/road-node';
import { Movement } from './movement';
import { TrafficLightPhase } from './traffic-light-phase';
import { NodeType } from '@core/map/node-type';
import type { Lane } from '@core/map/lane';
import type { TrafficLightPhaseConfig } from '@shared/config/traffic-light-phase-config';

export class TrafficLightPhaseFactory {
    private readonly config: TrafficLightPhaseConfig;

    constructor(config: TrafficLightPhaseConfig) {
        this.config = config;
    }

    createForNode(node: RoadNode, movements: readonly Movement[]): TrafficLightPhase[] {
        switch (node.getType()) {
            case NodeType.FourWayIntersection:
                return this.createFourWayPhases(movements);

            case NodeType.TJunction:
                return this.createTJunctionPhases(node, movements);

            case NodeType.Corner:
                return [];

            default:
                throw new Error(`Unsupported node type: ${node.getType()}`);
        }
    }

    private createFourWayPhases(movements: readonly Movement[]): TrafficLightPhase[] {
        const verticalMovements = movements.filter((movement) =>
            this.isVerticalIncomingLane(movement.getIncomingLane()),
        );

        const horizontalMovements = movements.filter((movement) =>
            this.isHorizontalIncomingLane(movement.getIncomingLane()),
        );

        return [
            new TrafficLightPhase('Vertical Green', this.config.greenDuration, verticalMovements),

            new TrafficLightPhase('Vertical Yellow', this.config.yellowDuration, verticalMovements),

            new TrafficLightPhase('All Red', this.config.allRedDuration, []),

            new TrafficLightPhase(
                'Horizontal Green',
                this.config.greenDuration,
                horizontalMovements,
            ),

            new TrafficLightPhase(
                'Horizontal Yellow',
                this.config.yellowDuration,
                horizontalMovements,
            ),

            new TrafficLightPhase('All Red', this.config.allRedDuration, []),
        ];
    }

    private createTJunctionPhases(
        node: RoadNode,
        movements: readonly Movement[],
    ): TrafficLightPhase[] {
        const incomingLanes = this.getIncomingLanes(movements);

        if (incomingLanes.length !== 3) {
            throw new Error(
                `T-junction ${node.getId()} expected 3 incoming lanes, ` +
                    `but found ${incomingLanes.length}.`,
            );
        }

        const uniqueApproach = this.findTJunctionStem(node, incomingLanes);

        const stemMovements = movements.filter(
            (movement) => movement.getIncomingLane() === uniqueApproach,
        );

        const topMovements = movements.filter(
            (movement) => movement.getIncomingLane() !== uniqueApproach,
        );

        return [
            new TrafficLightPhase(
                'T-Junction Stem Green',
                this.config.greenDuration,
                stemMovements,
            ),

            new TrafficLightPhase(
                'T-Junction Stem Yellow',
                this.config.yellowDuration,
                stemMovements,
            ),

            new TrafficLightPhase('All Red', this.config.allRedDuration, []),

            new TrafficLightPhase('T-Junction Side Green', this.config.greenDuration, topMovements),

            new TrafficLightPhase(
                'T-Junction Side Yellow',
                this.config.yellowDuration,
                topMovements,
            ),

            new TrafficLightPhase('All Red', this.config.allRedDuration, []),
        ];
    }

    private getIncomingLanes(movements: readonly Movement[]): Lane[] {
        return [...new Set(movements.map((movement) => movement.getIncomingLane()))];
    }

    private isVerticalIncomingLane(lane: Lane): boolean {
        const start = lane.getStartPosition();
        const end = lane.getEndPosition();

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        return Math.abs(dy) > Math.abs(dx);
    }

    private isHorizontalIncomingLane(lane: Lane): boolean {
        const start = lane.getStartPosition();
        const end = lane.getEndPosition();

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        return Math.abs(dx) > Math.abs(dy);
    }

    /**
     * Finds the lane that is the stem of the T-junction
     */
    private findTJunctionStem(node: RoadNode, incomingLanes: readonly Lane[]): Lane {
        /*
         * For a grid-based T-junction, the stem is
         * the approach whose direction is different
         * from the other two approaches.
         *
         * Example:
         *
         *       N
         *       |
         * W ----●---- E
         *
         * N is the unique approach.
         */

        const first = incomingLanes[0];

        const firstDirection = this.getAxis(first);

        const sameAxis = incomingLanes.filter((lane) => this.getAxis(lane) === firstDirection);

        if (sameAxis.length === 1) {
            return sameAxis[0];
        }

        const differentAxis = incomingLanes.filter((lane) => this.getAxis(lane) !== firstDirection);

        if (differentAxis.length === 1) {
            return differentAxis[0];
        }

        throw new Error(`Could not determine T-junction stem for node ${node.getId()}.`);
    }

    private getAxis(lane: Lane): 'horizontal' | 'vertical' {
        return this.isVerticalIncomingLane(lane) ? 'vertical' : 'horizontal';
    }
}
