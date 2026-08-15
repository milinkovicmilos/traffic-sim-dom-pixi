import type { Movement } from './movement';
import { TrafficLightPhase } from './traffic-light-phase';

export class TrafficLightController {
    private readonly phases: readonly TrafficLightPhase[];

    private currentPhaseIndex = 0;
    private elapsedTime = 0;

    constructor(phases: TrafficLightPhase[], initialTime: number = 0) {
        this.phases = phases;
        this.elapsedTime = initialTime;
    }

    /**
     * Update the controller based on the time passed since last update
     *
     * @param {number} deltaTime - time since last update
     */
    update(deltaTime: number) {
        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= this.getCurrentPhase().getDuration()) {
            this.elapsedTime = 0;

            this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
        }
    }

    /**
     * Returns the current phase that the traffic light controller is in
     */
    getCurrentPhase(): TrafficLightPhase {
        return this.phases[this.currentPhaseIndex];
    }

    /**
     * Returns the remaining time in current phase in milliseconds
     */
    getRemainingTime(): number {
        return Math.max(0, this.getCurrentPhase().getDuration() - this.elapsedTime);
    }

    /**
     * Returns whether or not the desired movement on the intersection is allowed by the current traffic light phase
     *
     * @param {Movement} movement - The desired movement by the vehicle
     */
    allowsMovement(movement: Movement): boolean {
        return this.getCurrentPhase().allowsMovement(movement);
    }
}
