import type { RoadNode } from '@core/map/road-node';
import type { TrafficLightController } from './traffic-light-controller';

export class TrafficLightSystem {
    private readonly controllers = new Map<number, TrafficLightController>();

    /**
     * Adds a traffic light controller to a given node
     */
    add(node: RoadNode, controller: TrafficLightController): void {
        this.controllers.set(node.getId(), controller);
    }

    /**
     * Updates all traffic ligth controllers in the system
     */
    update(dt: number): void {
        for (const controller of this.controllers.values()) {
            controller.update(dt);
        }
    }

    /**
     * Returns the traffic light controller for the road node with the given id
     *
     * @param {number} nodeId
     */
    getController(nodeId: number): TrafficLightController | undefined {
        return this.controllers.get(nodeId);
    }
}
