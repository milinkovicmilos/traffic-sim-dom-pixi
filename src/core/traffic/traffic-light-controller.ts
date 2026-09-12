import type { Movement } from './movement';
import { TrafficLightPhase } from './traffic-light-phase';

export class TrafficLightController {
    private readonly phases: readonly TrafficLightPhase[];

    private currentPhaseIndex = 0;
    private elapsedTime = 0;

    constructor(phases: TrafficLightPhase[], initialTime: number = 0) {
        if (phases.length === 0) {
            throw new Error('Traffic light controller must contain at least one phase.');
        }

        for (const phase of phases) {
            if (phase.getDuration() <= 0) {
                throw new Error('Traffic light phase duration must be greater than zero.');
            }
        }

        this.phases = [...phases];

        this.setInitialTime(initialTime);
    }

    /**
     * Updates the controller based on elapsed time in milliseconds.
     *
     * Any time that extends beyond a phase boundary is carried
     * into the next phase instead of being discarded.
     */
    update(deltaTime: number): void {
        if (deltaTime <= 0) {
            return;
        }

        this.elapsedTime += deltaTime;

        while (this.elapsedTime >= this.getCurrentPhase().getDuration()) {
            this.elapsedTime -= this.getCurrentPhase().getDuration();

            this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
        }
    }

    /**
     * Returns the current phase.
     */
    getCurrentPhase(): TrafficLightPhase {
        return this.phases[this.currentPhaseIndex];
    }

    /**
     * Returns the remaining time in the current phase.
     */
    getRemainingTime(): number {
        return Math.max(0, this.getCurrentPhase().getDuration() - this.elapsedTime);
    }

    /**
     * Returns whether the requested movement is currently allowed.
     *
     * The phase performs the logical movement comparison.
     */
    allowsMovement(movement: Movement): boolean {
        return this.getCurrentPhase().allowsMovement(movement);
    }

    private setInitialTime(initialTime: number): void {
        if (initialTime <= 0) {
            this.elapsedTime = 0;

            return;
        }

        let remainingTime = initialTime;

        while (remainingTime > 0) {
            const phaseDuration = this.getCurrentPhase().getDuration();

            if (remainingTime < phaseDuration) {
                this.elapsedTime = remainingTime;

                return;
            }

            remainingTime -= phaseDuration;

            this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
        }

        this.elapsedTime = 0;
    }
}
