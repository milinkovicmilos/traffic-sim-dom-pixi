import type { TrafficLightConfig } from '@shared/config/traffic-light-config';
import { TrafficLightPhase } from './traffic-light-phase';

export class TrafficLightController {
    private readonly config: TrafficLightConfig;
    private phase: TrafficLightPhase;
    private elapsedTime = 0;

    constructor(config: TrafficLightConfig) {
        this.config = config;
        this.phase = TrafficLightPhase.NorthSouthGreen;
    }

    getPhase(): TrafficLightPhase {
        return this.phase;
    }

    /**
     * Update the controller based on the time passed since last update
     *
     * @param {number} dt - Delta time - time since last update
     */
    update(dt: number) {
        this.elapsedTime += dt;

        if (this.elapsedTime < this.getCurrentPhaseDuration()) {
            return;
        }

        this.transitionToNextPhase();
    }

    /**
     * Returns the remaining time in current phase in milliseconds
     */
    getRemainingTime(): number {
        return Math.max(0, this.getCurrentPhaseDuration() - this.elapsedTime);
    }

    /**
     * Returns the duration of current phase in milliseconds
     */
    getCurrentPhaseDuration(): number {
        switch (this.phase) {
            case 'NorthSouthGreen':
                return this.config.northSouthGreenDuration;

            case 'NorthSouthYellow':
                return this.config.northSouthYellowDuration;

            case 'AllRedAfterNorthSouth':
                return this.config.allRedDuration;

            case 'EastWestGreen':
                return this.config.eastWestGreenDuration;

            case 'EastWestYellow':
                return this.config.eastWestYellowDuration;

            case 'AllRedAfterEastWest':
                return this.config.allRedDuration;
        }
    }

    /**
     * Transitions the traffic light to the next phase
     */
    private transitionToNextPhase(): void {
        this.phase = this.getNextPhase();
        this.elapsedTime = 0;
    }

    /**
     * Returns the next traffic light phase based on the current one
     */
    private getNextPhase(): TrafficLightPhase {
        switch (this.phase) {
            case 'NorthSouthGreen':
                return TrafficLightPhase.NorthSouthYellow;

            case 'NorthSouthYellow':
                return TrafficLightPhase.AllRedAfterNorthSouth;

            case 'AllRedAfterNorthSouth':
                return TrafficLightPhase.EastWestGreen;

            case 'EastWestGreen':
                return TrafficLightPhase.EastWestYellow;

            case 'EastWestYellow':
                return TrafficLightPhase.AllRedAfterEastWest;

            case 'AllRedAfterEastWest':
                return TrafficLightPhase.NorthSouthGreen;
        }
    }
}
