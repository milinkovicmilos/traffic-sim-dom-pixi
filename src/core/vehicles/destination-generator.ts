import type { Lane } from '@core/map/lane';
import { PathLocation } from '@core/pathfinding/pathlocation';
import { MathUtils } from '@shared/utils/math/math-utils';
import type { SeededRandom } from '@shared/utils/math/seeded-random';

export class DestinationGenerator {
    private static readonly MAX_ATTEMPTS = 100;

    private readonly lanes: readonly Lane[];
    private readonly random: SeededRandom;

    constructor(lanes: readonly Lane[], random: SeededRandom) {
        this.lanes = lanes;
        this.random = random;
    }

    generate(start?: PathLocation): PathLocation {
        if (this.lanes.length === 0) {
            throw new Error('Cannot generate a destination without lanes.');
        }

        for (let attempt = 0; attempt < DestinationGenerator.MAX_ATTEMPTS; attempt++) {
            const lane = this.getRandomLane();
            const distance = this.getRandomDistance(lane);

            if (start === undefined || !this.isSameLocation(start, lane, distance)) {
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
        return this.random.next() * lane.getLength();
    }

    private isSameLocation(start: PathLocation, lane: Lane, distance: number): boolean {
        if (start.getLane() !== lane) {
            return false;
        }

        return Math.abs(start.getDistance() - distance) < MathUtils.epsilon;
    }
}
