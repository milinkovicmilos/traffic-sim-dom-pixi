import type { Equatable } from '@shared/interfaces/equatable';

export class Vector2 implements Equatable<Vector2> {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(other: Vector2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiplyByScalar(value: number): Vector2 {
        return new Vector2(this.x * value, this.y * value);
    }

    divideByScalar(value: number): Vector2 {
        return new Vector2(this.x / value, this.y / value);
    }

    distanceTo(other: Vector2): number {
        return Math.hypot(other.x - this.x, other.y - this.y);
    }
}
