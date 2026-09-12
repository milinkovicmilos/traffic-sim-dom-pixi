import type { Movement } from './movement';

export class TrafficLightPhase {
    private readonly name: string;
    private readonly duration: number;
    private readonly allowedMovements: readonly Movement[];

    constructor(name: string, durationMs: number, allowedMovements: Movement[]) {
        if (durationMs <= 0) {
            throw new Error('Traffic light phase duration must be greater than zero.');
        }

        this.name = name;

        this.duration = durationMs;

        /*
         * Keep the list immutable from the phase's point of view.
         */
        this.allowedMovements = [...allowedMovements];
    }

    getName(): string {
        return this.name;
    }

    /**
     * Duration of the current traffic phase in milliseconds.
     */
    getDuration(): number {
        return this.duration;
    }

    getAllowedMovements(): readonly Movement[] {
        return this.allowedMovements;
    }

    /**
     * Returns whether the requested movement is currently allowed.
     *
     * Compare the actual lane transition rather than relying on
     * Movement object identity. This allows independently-created
     * Movement instances to represent the same logical movement.
     */
    allowsMovement(movement: Movement): boolean {
        return this.allowedMovements.some((allowedMovement) =>
            allowedMovement.isEquivalentTo(movement),
        );
    }
}
