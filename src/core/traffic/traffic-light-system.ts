import type { RoadNode } from '@core/map/road-node';
import { TrafficLightController } from './traffic-light-controller';
import type { Movement } from './movement';

export class TrafficLightSystem {
    private readonly controllers = new Map<RoadNode['id'], TrafficLightController>();

    /**
     * Adds a traffic light controller to a given node.
     */
    add(node: RoadNode, controller: TrafficLightController): void {
        this.controllers.set(node.getId(), controller);
    }

    /**
     * Updates all traffic light controllers.
     */
    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        for (const controller of this.controllers.values()) {
            controller.update(deltaTime);
        }
    }

    /**
     * Returns the controller for the given road node.
     */
    getController(nodeId: number): TrafficLightController | undefined {
        return this.controllers.get(nodeId);
    }

    /**
     * Returns whether the given movement is currently allowed.
     *
     * A node without a traffic light controller is treated as
     * an uncontrolled intersection, so the movement is allowed.
     */
    allowsMovement(movement: Movement): boolean {
        const nodeId = movement.getNode().getId();

        const controller = this.getController(nodeId);

        if (!controller) {
            return true;
        }

        return controller.allowsMovement(movement);
    }
}
