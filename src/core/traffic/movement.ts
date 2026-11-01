import type { Lane } from '@core/map/lane';
import type { RoadNode } from '@core/map/road-node';
import { MathUtils } from '@shared/utils/math/math-utils';

export class Movement {
    private readonly incomingLane: Lane;
    private readonly outgoingLane: Lane;

    constructor(incomingLane: Lane, outgoingLane: Lane) {
        // Check if the lanes start/end in the same node.
        if (incomingLane.getEndNode() !== outgoingLane.getStartNode()) {
            throw new Error('Incoming and outgoing lanes must be a part of the same road node.');
        }

        this.incomingLane = incomingLane;

        this.outgoingLane = outgoingLane;
    }

    getIncomingLane(): Lane {
        return this.incomingLane;
    }

    getOutgoingLane(): Lane {
        return this.outgoingLane;
    }

    /**
     * Returns the node at which the lanes are intersecting.
     */
    getNode(): RoadNode {
        return this.incomingLane.getEndNode();
    }

    /**
     * Returns whether this movement represents the same
     * lane-to-lane transition as another movement.
     *
     * Movement instances may be created independently by
     * different parts of the simulation, so object identity
     * alone must not be used to determine whether two movements
     * are logically equivalent.
     */
    isEquivalentTo(other: Movement): boolean {
        return this.incomingLane === other.incomingLane && this.outgoingLane === other.outgoingLane;
    }

    /**
     * Returns whether two vehicles could collide making these
     * movements at the same time.
     *
     * Lanes meet at the node's center, so a turn cuts the corner and lands
     * closer to the vehicle behind than the path distance between them.
     * Vehicles from one lane therefore only cross together when going straight.
     *
     * Opposing approaches only stay clear of each other when
     * neither vehicle turns across the other's path.
     */
    conflictsWith(other: Movement): boolean {
        if (this.incomingLane === other.incomingLane) {
            return !this.isStraight() || !other.isStraight();
        }

        if (this.outgoingLane === other.outgoingLane) {
            return true;
        }

        const isOpposing = this.incomingLane.getRoad() === other.incomingLane.getRoad();

        return !isOpposing || this.crossesOncomingTraffic() || other.crossesOncomingTraffic();
    }

    private isStraight(): boolean {
        return Math.cos(this.getTurnAngle()) > 1 - MathUtils.epsilon;
    }

    /**
     * Left turns and U-turns cross the opposing lane.
     *
     * Screen coordinates point y downwards, so a negative
     * sine is a turn to the left.
     */
    private crossesOncomingTraffic(): boolean {
        const turnAngle = this.getTurnAngle();

        return Math.sin(turnAngle) < -MathUtils.epsilon || Math.cos(turnAngle) < -MathUtils.epsilon;
    }

    private getTurnAngle(): number {
        return this.outgoingLane.getRotation() - this.incomingLane.getRotation();
    }
}
