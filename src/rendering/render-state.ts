import type { RoadNode } from '@core/map/road-node';
import type { Movement } from '@core/traffic/movement';
import type { TrafficLightController } from '@core/traffic/traffic-light-controller';
import type { Simulation } from '@core/simulation/simulation';
import type { Lane } from '@core/map/lane';

import type { RenderState, TrafficLightColor, TrafficLightRenderState } from './renderer';

import { Vector2 } from '@shared/utils/math/vector2';

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

        const groups = groupMovements(movements, controller);

        for (const [groupKey, group] of groups) {
            result.push(createTrafficLightState(node, groupKey, group));
        }
    }

    return result;
}

/**
 * Creates one rendered signal for each incoming lane.
 *
 * The renderer uses the controller's movement permission,
 * rather than duplicating any traffic-light logic.
 */
function groupMovements(
    movements: readonly Movement[],
    controller: TrafficLightController,
): Map<string, SignalGroup> {
    const groups = new Map<string, SignalGroup>();

    const phase = controller.getCurrentPhase();

    const remainingTime = controller.getRemainingTime();

    for (const movement of movements) {
        const incomingLane = movement.getIncomingLane();

        const groupKey = String(incomingLane.getId());

        const existing = groups.get(groupKey);

        if (existing) {
            existing.movements.push(movement);
            continue;
        }

        /*
         * One physical signal is drawn for the incoming lane.
         *
         * In the normal intersection setup all movements from
         * the same incoming lane share the same signal phase.
         *
         * Use the first movement as the lane signal's state,
         * but obtain permission directly from the controller,
         * which is the same logic used by vehicles.
         */
        const movementAllowed = controller.allowsMovement(movement);

        groups.set(groupKey, {
            color: getTrafficLightColor(phase.getName(), movementAllowed),
            remainingTime,
            movements: [movement],
        });
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

    // Right side of the incoming lane.
    const rightX = -directionY;

    const rightY = directionX;

    return new Vector2(
        end.x - directionX * TRAFFIC_LIGHT_STOP_DISTANCE + rightX * TRAFFIC_LIGHT_RIGHT_OFFSET,

        end.y - directionY * TRAFFIC_LIGHT_STOP_DISTANCE + rightY * TRAFFIC_LIGHT_RIGHT_OFFSET,
    );
}

function getTrafficLightColor(phaseName: string, movementAllowed: boolean): TrafficLightColor {
    const normalized = phaseName.trim().toLowerCase();

    /*
     * Never display green/yellow for a movement that the
     * controller says is prohibited.
     */
    if (!movementAllowed) {
        return 'red';
    }

    if (normalized.includes('yellow')) {
        return 'yellow';
    }

    if (normalized.includes('green')) {
        return 'green';
    }

    return 'red';
}
