import type { Lane } from '@core/map/lane';
import type { RoadNode } from '@core/map/road-node';
import type { Movement } from './movement';

/*
 * Tracks which movements are crossing each intersection, so that a vehicle
 * only enters once nothing crossing conflicts with its own movement.
 */
export class IntersectionReservations {
    private readonly movementsByNode = new Map<RoadNode['id'], Movement[]>();

    tryReserve(movement: Movement): boolean {
        const nodeId = movement.getNode().getId();
        const movements = this.movementsByNode.get(nodeId) ?? [];

        if (movements.some((reserved) => reserved.conflictsWith(movement))) {
            return false;
        }

        movements.push(movement);
        this.movementsByNode.set(nodeId, movements);

        return true;
    }

    release(movement: Movement): void {
        const movements = this.movementsByNode.get(movement.getNode().getId());

        movements?.splice(movements.indexOf(movement), 1);
    }

    countEntering(lane: Lane): number {
        const movements = this.movementsByNode.get(lane.getStartNode().getId()) ?? [];

        return movements.filter((movement) => movement.getOutgoingLane() === lane).length;
    }
}
