import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';
import type { SeededRandom } from '@shared/utils/math/seeded-random';

export class DestinationGenerator {
    private static readonly MAX_ATTEMPTS = 100;

    private readonly lanes: readonly Lane[];
    private readonly random: SeededRandom;
    private readonly laneEndMargin: number;

    /**
     * @param laneEndMargin Destinations stay this far from both lane
     * ends, so vehicles never stop inside an intersection or past a stop line.
     */
    constructor(lanes: readonly Lane[], random: SeededRandom, laneEndMargin: number) {
        this.lanes = lanes;
        this.random = random;
        this.laneEndMargin = laneEndMargin;
    }

    generate(start?: PathLocation): PathLocation {
        if (this.lanes.length === 0) {
            throw new Error('Cannot generate a destination without lanes.');
        }

        for (let attempt = 0; attempt < DestinationGenerator.MAX_ATTEMPTS; attempt++) {
            const lane = this.getRandomLane();
            const distance = this.getRandomDistance(lane);

            // A path always leaves its first lane, so the destination must be on another one.
            if (start === undefined || start.getLane() !== lane) {
                return new PathLocation(lane, distance);
            }
        }

        throw new Error('Failed to generate a valid destination.');
    }

    private getRandomLane(): Lane {
        const index = this.random.nextInt(0, this.lanes.length - 1);

        return this.lanes[index];
    }

    private getRandomDistance(lane: Lane): number {
        const range = lane.getLength() - this.laneEndMargin * 2;

        return this.laneEndMargin + this.random.next() * range;
    }
}
