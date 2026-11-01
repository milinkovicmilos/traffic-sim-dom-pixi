import type { RoadMap } from '@core/map/road-map';
import type { Simulation } from '@core/simulation/simulation';
import type { VehicleState } from '@core/vehicles/vehicle-state';
import { createRenderState } from '@rendering/render-state';
import type { RenderState, TrafficLightColor, TrafficLightRenderState } from '@rendering/renderer';
import { Angle } from '@shared/utils/math/angle';
import { MathUtils } from '@shared/utils/math/math-utils';
import { average, percentile } from '@shared/utils/math/statistics';
import { Vector2 } from '@shared/utils/math/vector2';
import { wait } from './benchmark-suite';

const STATES_PER_SECOND = 60;
const STEP_MS = 1000 / STATES_PER_SECOND;
const VALUES_PER_VEHICLE = 3;

// Timers and slow frames can overrun the requested timeline; past its end the last state holds.
const TIMELINE_MARGIN_MS = 2000;

// Generating blocks the frame loop anyway, but the page must stay responsive enough to repaint.
const YIELD_INTERVAL_MS = 50;

const TRAFFIC_LIGHT_COLORS: readonly TrafficLightColor[] = ['red', 'yellow', 'green'];

export interface SimulationTraceInfo {
    stateHash: string;
    statesPerSecond: number;
    stateCount: number;
    averageStepTime: number;
    p95StepTime: number;
}

/*
 * The states of one simulation run, computed up front with a fixed time step, so
 * every renderer shows the same traffic at the same moment. A renderer that is
 * slower only skips states.
 *
 * Refresh rates differ between test machines, so states between two stored steps
 * are interpolated instead of storing enough steps for the fastest display.
 */
export class SimulationTrace {
    private readonly stateCount: number;
    private readonly vehicleValues: Float32Array;
    private readonly trafficLightColors: Uint8Array;
    private readonly trafficLightRemainingTimes: Float32Array;
    private info!: SimulationTraceInfo;

    // Reused between frames, so replaying does not allocate per vehicle.
    private readonly vehicleStates: VehicleState[];
    private readonly trafficLightStates: TrafficLightRenderState[];

    private constructor(initialState: RenderState, stateCount: number) {
        const trafficLightValueCount = stateCount * initialState.trafficLights.length;

        this.stateCount = stateCount;
        this.vehicleValues = new Float32Array(
            stateCount * initialState.vehicles.length * VALUES_PER_VEHICLE,
        );
        this.trafficLightColors = new Uint8Array(trafficLightValueCount);
        this.trafficLightRemainingTimes = new Float32Array(trafficLightValueCount);
        this.vehicleStates = initialState.vehicles.map(() => ({
            position: new Vector2(0, 0),
            angle: 0,
        }));
        this.trafficLightStates = initialState.trafficLights.map((state) => ({ ...state }));
    }

    // Advances the given simulation, which must not be used for anything else afterwards.
    static async generate(simulation: Simulation, timelineMs: number): Promise<SimulationTrace> {
        const stateCount =
            Math.ceil(((timelineMs + TIMELINE_MARGIN_MS) / 1000) * STATES_PER_SECOND) + 1;
        const initialState = createRenderState(simulation);
        const trace = new SimulationTrace(initialState, stateCount);
        const stepTimes: number[] = [];

        trace.storeState(0, initialState);

        let lastYieldTime = performance.now();

        for (let stateIndex = 1; stateIndex < stateCount; stateIndex += 1) {
            const stepStart = performance.now();

            simulation.update(STEP_MS);

            stepTimes.push(performance.now() - stepStart);

            trace.storeState(stateIndex, createRenderState(simulation));

            if (performance.now() - lastYieldTime >= YIELD_INTERVAL_MS) {
                await wait(0);

                lastYieldTime = performance.now();
            }
        }

        trace.info = {
            stateHash: trace.computeHash(),
            statesPerSecond: STATES_PER_SECOND,
            stateCount,
            averageStepTime: average(stepTimes),
            p95StepTime: percentile(stepTimes, 95),
        };

        return trace;
    }

    getInfo(): SimulationTraceInfo {
        return this.info;
    }

    // The returned state is overwritten by the next call.
    getRenderState(elapsedMs: number, roadMap: RoadMap): RenderState {
        const position = MathUtils.clamp(elapsedMs / STEP_MS, 0, this.stateCount - 1);
        const stateIndex = Math.floor(position);
        const nextStateIndex = Math.min(stateIndex + 1, this.stateCount - 1);
        const progress = position - stateIndex;

        this.updateVehicleStates(stateIndex, nextStateIndex, progress);
        this.updateTrafficLightStates(stateIndex);

        return {
            roadMap,
            trafficLights: this.trafficLightStates,
            vehicles: this.vehicleStates,
        };
    }

    private storeState(stateIndex: number, state: RenderState): void {
        const vehicleOffset = stateIndex * state.vehicles.length * VALUES_PER_VEHICLE;
        const trafficLightOffset = stateIndex * state.trafficLights.length;

        state.vehicles.forEach((vehicle, index) => {
            const offset = vehicleOffset + index * VALUES_PER_VEHICLE;

            this.vehicleValues[offset] = vehicle.position.x;
            this.vehicleValues[offset + 1] = vehicle.position.y;
            this.vehicleValues[offset + 2] = vehicle.angle;
        });

        state.trafficLights.forEach((trafficLight, index) => {
            this.trafficLightColors[trafficLightOffset + index] = TRAFFIC_LIGHT_COLORS.indexOf(
                trafficLight.color,
            );
            this.trafficLightRemainingTimes[trafficLightOffset + index] =
                trafficLight.remainingTime;
        });
    }

    private updateVehicleStates(
        stateIndex: number,
        nextStateIndex: number,
        progress: number,
    ): void {
        const values = this.vehicleValues;
        const offset = stateIndex * this.vehicleStates.length * VALUES_PER_VEHICLE;
        const nextOffset = nextStateIndex * this.vehicleStates.length * VALUES_PER_VEHICLE;

        for (let i = 0; i < this.vehicleStates.length; i += 1) {
            const from = offset + i * VALUES_PER_VEHICLE;
            const to = nextOffset + i * VALUES_PER_VEHICLE;
            const vehicle = this.vehicleStates[i];

            vehicle.position.x = MathUtils.lerp(values[from], values[to], progress);
            vehicle.position.y = MathUtils.lerp(values[from + 1], values[to + 1], progress);
            vehicle.angle = Angle.lerp(values[from + 2], values[to + 2], progress);
        }
    }

    // Lights change in discrete phases, so they hold their last stored state.
    private updateTrafficLightStates(stateIndex: number): void {
        const offset = stateIndex * this.trafficLightStates.length;

        this.trafficLightStates.forEach((trafficLight, index) => {
            trafficLight.color = TRAFFIC_LIGHT_COLORS[this.trafficLightColors[offset + index]];
            trafficLight.remainingTime = this.trafficLightRemainingTimes[offset + index];
        });
    }

    // Lets exported results prove which runs saw identical states (FNV-1a over the stored values).
    private computeHash(): string {
        let hash = 0x811c9dc5;

        for (const values of [
            new Uint32Array(this.vehicleValues.buffer),
            new Uint32Array(this.trafficLightRemainingTimes.buffer),
            this.trafficLightColors,
        ]) {
            for (let i = 0; i < values.length; i += 1) {
                hash = Math.imul(hash ^ values[i], 0x01000193);
            }
        }

        return (hash >>> 0).toString(16).padStart(8, '0');
    }
}
