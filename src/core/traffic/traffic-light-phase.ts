import type { Movement } from './movement';

export class TrafficLightPhase {
    private readonly name: string;
    private readonly duration: number;
    private readonly allowedMovements: readonly Movement[];

    constructor(name: string, durationMs: number, allowedMovements: Movement[]) {
        this.name = name;
        this.duration = durationMs;
        this.allowedMovements = allowedMovements;
    }

    getName(): string {
        return this.name;
    }

    /**
     * Duration of the current traffic phase in milliseconds
     */
    getDuration(): number {
        return this.duration;
    }

    getAllowedMovements(): readonly Movement[] {
        return this.allowedMovements;
    }

    allowsMovement(movement: Movement): boolean {
        return this.allowedMovements.includes(movement);
    }
}
