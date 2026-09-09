import type { RendererType } from '@rendering/renderer-factory';

export interface BenchmarkFrameSample {
    timestamp: number;
    frameTime: number;
    simulationTime: number;
    renderTime: number;
    fps: number;
    mainThreadUtilization: number;
}

export interface BenchmarkEnvironment {
    logicalProcessors: number;
    deviceMemoryGb: number | null;
}

export interface BenchmarkSnapshot {
    renderer: RendererType;

    durationMs: number;

    frameCount: number;

    averageFps: number;
    low1PercentFps: number;

    averageFrameTime: number;
    p95FrameTime: number;

    averageSimulationTime: number;
    p95SimulationTime: number;

    averageRenderTime: number;
    p95RenderTime: number;

    averageMainThreadUtilization: number;
    peakMainThreadUtilization: number;

    memoryStartMb: number | null;
    memoryEndMb: number | null;
    memoryPeakMb: number | null;

    vehicleCount: number;

    rows: number;
    columns: number;

    environment: BenchmarkEnvironment;
}

export interface BenchmarkCurrentMetrics {
    renderer: RendererType;

    fps: number;

    frameTimeMs: number;

    simulationTimeMs: number;

    renderTimeMs: number;

    mainThreadUtilization: number;

    memoryMb: number | null;

    vehicleCount: number;

    frameCount: number;
}

interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

interface NavigatorWithDeviceMemory extends Navigator {
    deviceMemory?: number;
}

export class BenchmarkMonitor {
    private recording = false;

    private recordingRenderer: RendererType | null = null;

    private recordingStartedAt = 0;

    private recordingSamples: BenchmarkFrameSample[] = [];

    private recordingMemoryStartMb: number | null = null;

    private recordingMemoryPeakMb: number | null = null;

    private currentMemoryMb: number | null = null;

    private lastMemorySampleTime = 0;

    private readonly liveFrameTimes: number[] = [];

    private readonly liveFrameTimeLimit = 60;

    private currentMetrics: BenchmarkCurrentMetrics = {
        renderer: 'dom',
        fps: 0,
        frameTimeMs: 0,
        simulationTimeMs: 0,
        renderTimeMs: 0,
        mainThreadUtilization: 0,
        memoryMb: null,
        vehicleCount: 0,
        frameCount: 0,
    };

    constructor() {
        this.currentMemoryMb = this.readMemoryMb();
    }

    isRecording(): boolean {
        return this.recording;
    }

    getCurrentMetrics(): BenchmarkCurrentMetrics {
        return {
            ...this.currentMetrics,
        };
    }

    getEnvironment(): BenchmarkEnvironment {
        const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;

        return {
            logicalProcessors: navigator.hardwareConcurrency || 1,

            deviceMemoryGb:
                typeof navigatorWithMemory.deviceMemory === 'number'
                    ? navigatorWithMemory.deviceMemory
                    : null,
        };
    }

    startRecording(renderer: RendererType): void {
        if (this.recording) {
            return;
        }

        this.recording = true;

        this.recordingRenderer = renderer;

        this.recordingStartedAt = performance.now();

        this.recordingSamples = [];

        this.recordingMemoryStartMb = this.readMemoryMb();

        this.recordingMemoryPeakMb = this.recordingMemoryStartMb;

        this.lastMemorySampleTime = performance.now();
    }

    stopRecording(
        renderer: RendererType,
        vehicleCount: number,
        rows: number,
        columns: number,
    ): BenchmarkSnapshot {
        if (!this.recording) {
            throw new Error('No benchmark recording is active.');
        }

        const stoppedAt = performance.now();

        this.recording = false;

        const memoryEndMb = this.readMemoryMb();

        if (
            memoryEndMb !== null &&
            (this.recordingMemoryPeakMb === null || memoryEndMb > this.recordingMemoryPeakMb)
        ) {
            this.recordingMemoryPeakMb = memoryEndMb;
        }

        const samples = this.recordingSamples;

        const durationMs = Math.max(0, stoppedAt - this.recordingStartedAt);

        const recordingRenderer = this.recordingRenderer ?? renderer;

        const snapshot: BenchmarkSnapshot = {
            renderer: recordingRenderer,

            durationMs,

            frameCount: samples.length,

            averageFps: this.average(samples.map((sample) => sample.fps)),

            low1PercentFps: this.calculateLow1PercentFps(samples),

            averageFrameTime: this.average(samples.map((sample) => sample.frameTime)),

            p95FrameTime: this.percentile(
                samples.map((sample) => sample.frameTime),
                95,
            ),

            averageSimulationTime: this.average(samples.map((sample) => sample.simulationTime)),

            p95SimulationTime: this.percentile(
                samples.map((sample) => sample.simulationTime),
                95,
            ),

            averageRenderTime: this.average(samples.map((sample) => sample.renderTime)),

            p95RenderTime: this.percentile(
                samples.map((sample) => sample.renderTime),
                95,
            ),

            averageMainThreadUtilization: this.average(
                samples.map((sample) => sample.mainThreadUtilization),
            ),

            peakMainThreadUtilization:
                samples.length === 0
                    ? 0
                    : Math.max(...samples.map((sample) => sample.mainThreadUtilization)),

            memoryStartMb: this.recordingMemoryStartMb,

            memoryEndMb,

            memoryPeakMb: this.recordingMemoryPeakMb,

            vehicleCount,

            rows,

            columns,

            environment: this.getEnvironment(),
        };

        this.recordingRenderer = null;

        this.recordingStartedAt = 0;

        this.recordingSamples = [];

        this.recordingMemoryStartMb = null;

        this.recordingMemoryPeakMb = null;

        return snapshot;
    }

    recordFrame(
        timestamp: number,
        frameTime: number,
        simulationTime: number,
        renderTime: number,
        vehicleCount: number,
    ): void {
        const safeFrameTime = Math.max(frameTime, 0.001);

        this.liveFrameTimes.push(safeFrameTime);

        if (this.liveFrameTimes.length > this.liveFrameTimeLimit) {
            this.liveFrameTimes.shift();
        }

        const averageLiveFrameTime = this.average(this.liveFrameTimes);

        const fps = averageLiveFrameTime > 0 ? 1000 / averageLiveFrameTime : 0;

        const appTime = simulationTime + renderTime;

        const mainThreadUtilization = Math.min(100, Math.max(0, (appTime / safeFrameTime) * 100));

        if (timestamp - this.lastMemorySampleTime >= 250) {
            this.currentMemoryMb = this.readMemoryMb();

            this.lastMemorySampleTime = timestamp;

            if (
                this.recording &&
                this.currentMemoryMb !== null &&
                (this.recordingMemoryPeakMb === null ||
                    this.currentMemoryMb > this.recordingMemoryPeakMb)
            ) {
                this.recordingMemoryPeakMb = this.currentMemoryMb;
            }
        }

        this.currentMetrics = {
            renderer: this.recordingRenderer ?? this.currentMetrics.renderer,

            fps,

            frameTimeMs: safeFrameTime,

            simulationTimeMs: simulationTime,

            renderTimeMs: renderTime,

            mainThreadUtilization,

            memoryMb: this.currentMemoryMb,

            vehicleCount,

            frameCount: this.currentMetrics.frameCount + 1,
        };

        if (this.recording) {
            this.recordingSamples.push({
                timestamp,

                frameTime: safeFrameTime,

                simulationTime,

                renderTime,

                fps,

                mainThreadUtilization,
            });
        }
    }

    private readMemoryMb(): number | null {
        const performanceWithMemory = performance as PerformanceWithMemory;

        const memory = performanceWithMemory.memory;

        if (!memory) {
            return null;
        }

        return memory.usedJSHeapSize / (1024 * 1024);
    }

    private calculateLow1PercentFps(samples: readonly BenchmarkFrameSample[]): number {
        if (samples.length === 0) {
            return 0;
        }

        const frameTimes = samples.map((sample) => sample.frameTime).sort((a, b) => b - a);

        const count = Math.max(1, Math.ceil(frameTimes.length * 0.01));

        const slowestFrames = frameTimes.slice(0, count);

        const averageSlowFrameTime = this.average(slowestFrames);

        return averageSlowFrameTime > 0 ? 1000 / averageSlowFrameTime : 0;
    }

    private average(values: readonly number[]): number {
        if (values.length === 0) {
            return 0;
        }

        let total = 0;

        for (const value of values) {
            total += value;
        }

        return total / values.length;
    }

    private percentile(values: readonly number[], percentile: number): number {
        if (values.length === 0) {
            return 0;
        }

        const sorted = [...values].sort((a, b) => a - b);

        const index = (percentile / 100) * (sorted.length - 1);

        const lower = Math.floor(index);

        const upper = Math.ceil(index);

        if (lower === upper) {
            return sorted[lower];
        }

        const weight = index - lower;

        return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
    }
}
