import type { RendererType } from '@rendering/renderer-factory';

export interface BenchmarkFrameSample {
    timestamp: number;
    frameTime: number;
    simulationTime: number;
    renderTime: number;
    fps: number;
    mainThreadUtilization: number;
    rafInterval: number | null;
}

export interface BenchmarkEnvironment {
    logicalProcessors: number;
    deviceMemoryGb: number | null;
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    viewportWidth: number;
    viewportHeight: number;
    gpuName: string | null;
    refreshRateEstimate: number | null;
}

// Environment values only the app knows (scene element size, active renderer's GPU).
export interface BenchmarkEnvironmentContext {
    viewportWidth: number;
    viewportHeight: number;
    gpuName: string | null;
}

export interface BenchmarkRunLabel {
    suiteId: string;
    runIndex: number;
}

export interface BenchmarkSnapshot {
    suiteId: string | null;
    runIndex: number | null;
    codeVersion: string;
    renderer: RendererType;
    durationMs: number;
    frameCount: number;
    averageFps: number;
    low1PercentFps: number;
    averageFrameTime: number;
    p95FrameTime: number;
    averageRafInterval: number;
    p95RafInterval: number;
    averageSimulationTime: number;
    p95SimulationTime: number;
    averageRenderTime: number;
    p95RenderTime: number;
    averageGpuTime: number | null;
    p95GpuTime: number | null;
    peakGpuTime: number | null;
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
    gpuTimeMs: number | null;
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
    private readonly getEnvironmentContext: () => BenchmarkEnvironmentContext;
    private refreshRateEstimate: number | null = null;
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
    private latestGpuTimeMs: number | null = null;
    private readonly gpuTimes: number[] = [];
    private currentMetrics: BenchmarkCurrentMetrics = {
        renderer: 'dom',
        fps: 0,
        frameTimeMs: 0,
        simulationTimeMs: 0,
        renderTimeMs: 0,
        gpuTimeMs: null,
        mainThreadUtilization: 0,
        memoryMb: null,
        vehicleCount: 0,
        frameCount: 0,
    };

    constructor(getEnvironmentContext: () => BenchmarkEnvironmentContext) {
        this.getEnvironmentContext = getEnvironmentContext;
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

    recordGpuTime(gpuTimeMs: number): void {
        if (!Number.isFinite(gpuTimeMs) || gpuTimeMs < 0) {
            return;
        }

        this.latestGpuTimeMs = gpuTimeMs;

        if (this.recording) {
            this.gpuTimes.push(gpuTimeMs);
        }
    }

    resetLiveMetrics(renderer: RendererType, vehicleCount: number): void {
        this.liveFrameTimes.length = 0;
        this.currentMemoryMb = this.readMemoryMb();
        this.lastMemorySampleTime = performance.now();
        this.latestGpuTimeMs = null;
        this.gpuTimes.length = 0;

        this.currentMetrics = {
            renderer,
            fps: 0,
            frameTimeMs: 0,
            simulationTimeMs: 0,
            gpuTimeMs: null,
            renderTimeMs: 0,
            mainThreadUtilization: 0,
            memoryMb: this.currentMemoryMb,
            vehicleCount,
            frameCount: 0,
        };
    }

    getEnvironment(): BenchmarkEnvironment {
        const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;
        const context = this.getEnvironmentContext();

        return {
            logicalProcessors: navigator.hardwareConcurrency || 1,
            deviceMemoryGb:
                typeof navigatorWithMemory.deviceMemory === 'number'
                    ? navigatorWithMemory.deviceMemory
                    : null,
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            viewportWidth: context.viewportWidth,
            viewportHeight: context.viewportHeight,
            gpuName: context.gpuName,
            refreshRateEstimate: this.refreshRateEstimate,
        };
    }

    /*
     * Collects bare rAF intervals for the given duration and stores
     * 1000 / median as the display refresh rate estimate (Hz).
     *
     * The caller must keep the simulation and renderer idle meanwhile,
     * otherwise app work stretches the intervals.
     */
    async measureRefreshRate(durationMs: number): Promise<number | null> {
        const intervals: number[] = [];

        await new Promise<void>((resolve) => {
            let startTime: number | null = null;
            let previousTime: number | null = null;

            const tick = (time: number): void => {
                if (previousTime !== null) {
                    intervals.push(time - previousTime);
                }

                previousTime = time;
                startTime ??= time;

                if (time - startTime >= durationMs) {
                    resolve();
                    return;
                }

                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });

        const medianInterval = this.percentile(intervals, 50);

        this.refreshRateEstimate = medianInterval > 0 ? 1000 / medianInterval : null;

        return this.refreshRateEstimate;
    }

    startRecording(renderer: RendererType): void {
        if (this.recording) {
            return;
        }

        this.recording = true;
        this.recordingRenderer = renderer;
        this.recordingStartedAt = performance.now();
        this.recordingSamples = [];
        this.gpuTimes.length = 0;
        this.latestGpuTimeMs = null;
        this.recordingMemoryStartMb = this.readMemoryMb();
        this.recordingMemoryPeakMb = this.recordingMemoryStartMb;
        this.lastMemorySampleTime = performance.now();
    }

    stopRecording(
        renderer: RendererType,
        vehicleCount: number,
        rows: number,
        columns: number,
        runLabel: BenchmarkRunLabel | null = null,
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
        const rafIntervals = samples
            .map((sample) => sample.rafInterval)
            .filter((interval) => interval !== null);

        const snapshot: BenchmarkSnapshot = {
            suiteId: runLabel?.suiteId ?? null,
            runIndex: runLabel?.runIndex ?? null,
            codeVersion: __CODE_VERSION__,
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
            averageRafInterval: this.average(rafIntervals),
            p95RafInterval: this.percentile(rafIntervals, 95),
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
            averageGpuTime: this.gpuTimes.length === 0 ? null : this.average(this.gpuTimes),
            p95GpuTime: this.gpuTimes.length === 0 ? null : this.percentile(this.gpuTimes, 95),
            peakGpuTime: this.gpuTimes.length === 0 ? null : Math.max(...this.gpuTimes),
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
        this.gpuTimes.length = 0;
        this.latestGpuTimeMs = null;
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
        rafInterval: number | null,
    ): void {
        const safeFrameTime = Math.max(frameTime, 0.001);

        this.liveFrameTimes.push(safeFrameTime);

        if (this.liveFrameTimes.length > this.liveFrameTimeLimit) {
            this.liveFrameTimes.shift();
        }

        const averageLiveFrameTime = this.average(this.liveFrameTimes);
        const fps = averageLiveFrameTime > 0 ? 1000 / averageLiveFrameTime : 0;

        /*
         * This is the percentage of the frame budget spent by:
         *
         *   simulation + renderer
         *
         * It is not total browser main-thread utilization.
         */
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
            gpuTimeMs: this.latestGpuTimeMs,
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
                rafInterval,
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
