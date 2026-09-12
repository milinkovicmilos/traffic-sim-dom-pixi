import type { RoadNode } from '@core/map/road-node';
import type { Movement } from '@core/traffic/movement';
import type { TrafficLightController } from '@core/traffic/traffic-light-controller';
import type { Simulation } from '@core/simulation/simulation';

import type { RenderState, TrafficLightColor, TrafficLightRenderState } from './renderer';
import { Vector2 } from '@shared/utils/math/vector2';
import type { Lane } from '@core/map/lane';

const TRAFFIC_LIGHT_STOP_DISTANCE = 38;
const TRAFFIC_LIGHT_RIGHT_OFFSET = 30;

interface SignalGroup {
    color: TrafficLightColor;
    remainingTime: number;
    movements: Movement[];
}

export function createRenderState(simulation: Simulation): RenderState {
    return {
        roadMap: simulation.getRoadMap(),
        trafficLights: createTrafficLightStates(simulation),
        vehicles: simulation.getVehicleStates(),
    };
}

function createTrafficLightStates(simulation: Simulation): TrafficLightRenderState[] {
    const result: TrafficLightRenderState[] = [];

    for (const node of simulation.getRoadMap().getNodes()) {
        const controller = simulation.getTrafficLightSystem().getController(node.getId());

        if (!controller) {
            continue;
        }

        const movements = simulation.getMovements(node.getId());

        if (!movements || movements.length === 0) {
            continue;
        }

        // Group all movements belonging to the same incoming lane.
        const groups = groupMovements(movements, controller);

        for (const [groupKey, group] of groups) {
            result.push(createTrafficLightState(node, groupKey, group));
        }
    }

    return result;
}

function groupMovements(
    movements: readonly Movement[],
    controller: TrafficLightController,
): Map<string, SignalGroup> {
    const groups = new Map<string, SignalGroup>();

    const phase = controller.getCurrentPhase();
    const remainingTime = controller.getRemainingTime();

    for (const movement of movements) {
        const movementAllowed = phase.allowsMovement(movement);

        const color = getTrafficLightColor(phase.getName(), movementAllowed);

        const incomingLane = movement.getIncomingLane();

        // One physical signal per incoming lane.
        const groupKey = String(incomingLane.getId());

        const existing = groups.get(groupKey);

        if (existing) {
            existing.movements.push(movement);
        } else {
            groups.set(groupKey, {
                color,
                remainingTime,
                movements: [movement],
            });
        }
    }

    return groups;
}

function createTrafficLightState(
    node: RoadNode,
    groupKey: string,
    group: SignalGroup,
): TrafficLightRenderState {
    const incomingLane = group.movements[0].getIncomingLane();

    return {
        key: `${node.getId()}:${groupKey}`,

        nodeId: node.getId(),

        position: getTrafficLightPosition(incomingLane),

        color: group.color,

        remainingTime: group.remainingTime,
    };
}

function getTrafficLightPosition(lane: Lane): Vector2 {
    const start = lane.getStartPosition();

    const end = lane.getEndPosition();

    const dx = end.x - start.x;

    const dy = end.y - start.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return end;
    }

    const directionX = dx / length;

    const directionY = dy / length;

    // Right side of the incoming lane
    const rightX = -directionY;
    const rightY = directionX;

    // Place the signal before the intersection and
    // on the right side of the incoming lane.
    return new Vector2(
        end.x - directionX * TRAFFIC_LIGHT_STOP_DISTANCE + rightX * TRAFFIC_LIGHT_RIGHT_OFFSET,

        end.y - directionY * TRAFFIC_LIGHT_STOP_DISTANCE + rightY * TRAFFIC_LIGHT_RIGHT_OFFSET,
    );
}

function getTrafficLightColor(phaseName: string, movementAllowed: boolean): TrafficLightColor {
    const normalized = phaseName.trim().toLowerCase();

    // A movement that is not part of the current phase
    // must always remain red to avoid all lights being yellow.
    if (!movementAllowed) {
        return 'red';
    }

    if (normalized.includes('yellow')) {
        return 'yellow';
    }

    if (normalized.includes('green')) {
        return 'green';
    }

    // All other phases or unknown ones are red
    return 'red';
}
