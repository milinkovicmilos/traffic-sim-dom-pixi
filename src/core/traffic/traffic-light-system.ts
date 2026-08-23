import type { RoadNode } from '@core/map/road-node';
import { TrafficLightController } from './traffic-light-controller';
import type { Movement } from './movement';

export class TrafficLightSystem {
    private readonly controllers = new Map<RoadNode['id'], TrafficLightController>();

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

    allowsMovement(movement: Movement): boolean {
        const nodeId = movement.getNode().getId();
        const controller = this.getController(nodeId);

        // If there is no controller for this road node it means that it is not an intersection, so we allow it
        if (!controller) {
            return true;
        }

        return controller.allowsMovement(movement);
    }
}
