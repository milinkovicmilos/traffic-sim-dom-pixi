import { RoadNode } from '@core/map/road-node';
import { Movement } from './movement';

export class MovementGenerator {
    generate(node: RoadNode): readonly Movement[] {
        const incomingLanes = node.getIncomingLanes();
        const outgoingLanes = node.getOutgoingLanes();

        const movements: Movement[] = [];
        for (const incomingLane of incomingLanes) {
            for (const outgoingLane of outgoingLanes) {
                if (incomingLane === outgoingLane) {
                    continue;
                }

                // Don't allow U-turns on the corner roads/nodes
                if (
                    node.getType() === 'Corner' &&
                    incomingLane.getRoad() === outgoingLane.getRoad()
                ) {
                    continue;
                }

                movements.push(new Movement(incomingLane, outgoingLane));
            }
        }

        return movements;
    }
}
