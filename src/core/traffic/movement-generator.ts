import { RoadNode } from '@core/map/road-node';
import { Movement } from './movement';

export class MovementGenerator {
    generate(node: RoadNode): Movement[] {
        const incomingLanes = node.getIncomingLanes();
        const outgoingLanes = node.getOutgoingLanes();

        const movements: Movement[] = [];
        for (const incomingLane of incomingLanes) {
            for (const outgoingLane of outgoingLanes) {
                if (incomingLane === outgoingLane) {
                    continue;
                }

                movements.push(new Movement(incomingLane, outgoingLane));
            }
        }

        return movements;
    }
}
