import { Lane } from '@core/map/lane';
import { Movement } from '@core/traffic/movement';
import { Path } from './path';
import type { PathLocation } from './pathlocation';

interface SearchState {
    readonly lane: Lane;
    readonly previous: SearchState | null;
    readonly movement: Movement | null;
}

export class Pathfinder {
    private readonly movementsByIncomingLane = new Map<Lane, readonly Movement[]>();

    constructor(movements: readonly Movement[]) {
        this.indexMovements(movements);
    }

    findPath(start: PathLocation, end: PathLocation): Path | null {
        const result = this.search(start.getLane(), end.getLane());

        if (result === null) {
            return null;
        }

        return this.createPath(start, end, result);
    }

    private search(startLane: Lane, destinationLane: Lane): SearchState | null {
        const queue: SearchState[] = [
            {
                lane: startLane,
                previous: null,
                movement: null,
            },
        ];

        const visited = new Set<Lane>();

        visited.add(startLane);

        let queueIndex = 0;

        while (queueIndex < queue.length) {
            const current = queue[queueIndex++];

            if (current.lane === destinationLane) {
                return current;
            }

            const movements = this.movementsByIncomingLane.get(current.lane) ?? [];

            for (const movement of movements) {
                const nextLane = movement.getOutgoingLane();

                if (visited.has(nextLane)) {
                    continue;
                }

                visited.add(nextLane);

                queue.push({
                    lane: nextLane,
                    previous: current,
                    movement,
                });
            }
        }

        return null;
    }

    private createPath(start: PathLocation, end: PathLocation, endState: SearchState): Path {
        const lanes: Lane[] = [];
        const movements: Movement[] = [];

        let current: SearchState | null = endState;

        while (current !== null) {
            lanes.push(current.lane);

            if (current.movement !== null) {
                movements.push(current.movement);
            }

            current = current.previous;
        }

        lanes.reverse();
        movements.reverse();

        return new Path(start, end, lanes, movements);
    }

    private indexMovements(movements: readonly Movement[]): void {
        for (const movement of movements) {
            const incomingLane = movement.getIncomingLane();

            const existing = this.movementsByIncomingLane.get(incomingLane) ?? [];

            this.movementsByIncomingLane.set(incomingLane, [...existing, movement]);
        }
    }
}
