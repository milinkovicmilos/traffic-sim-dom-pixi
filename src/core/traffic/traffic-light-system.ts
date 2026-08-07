import type { Intersection } from '@core/map/intersection';
import type { TrafficLightController } from './traffic-light-controller';

export class TrafficLightSystem {
    private readonly controllers = new Map<number, TrafficLightController>();

    /**
     * Adds a traffic light controller to a given intersection
     */
    add(intersection: Intersection, controller: TrafficLightController): void {
        this.controllers.set(intersection.Id, controller);
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
     * @param {number} intersectionId
     */
    getController(intersectionId: number): TrafficLightController | undefined {
        return this.controllers.get(intersectionId);
    }
}
