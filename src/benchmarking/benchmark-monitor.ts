import type { RendererType } from '@rendering/renderer-factory';
import { average, percentile } from '@shared/utils/math/statistics';

export interface BenchmarkFrameSample {
    timestamp: number;
    frameTime: number;
    simulationTime: number;
    renderTime: number;
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
    averageBrowserRenderTime: number | null;
    p95BrowserRenderTime: number | null;
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
    browserRenderTimeMs: number | null;
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
    private readonly liveRafIntervals: number[] = [];
    private readonly liveRafIntervalLimit = 60;
    private latestGpuTimeMs: number | null = null;
    private readonly gpuTimes: number[] = [];
    private latestBrowserRenderTimeMs: number | null = null;
    private readonly browserRenderTimes: number[] = [];
    private currentMetrics: BenchmarkCurrentMetrics = {
        renderer: 'dom',
        fps: 0,
        frameTimeMs: 0,
        simulationTimeMs: 0,
        renderTimeMs: 0,
        browserRenderTimeMs: null,
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

    recordBrowserRenderTime(browserRenderTimeMs: number): void {
        this.latestBrowserRenderTimeMs = browserRenderTimeMs;

        if (this.recording) {
            this.browserRenderTimes.push(browserRenderTimeMs);
        }
    }

    resetLiveMetrics(renderer: RendererType, vehicleCount: number): void {
        this.liveRafIntervals.length = 0;
        this.currentMemoryMb = this.readMemoryMb();
        this.lastMemorySampleTime = performance.now();
        this.latestGpuTimeMs = null;
        this.latestBrowserRenderTimeMs = null;

        this.currentMetrics = {
            renderer,
            fps: 0,
            frameTimeMs: 0,
            simulationTimeMs: 0,
            browserRenderTimeMs: null,
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

        const medianInterval = percentile(intervals, 50);

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
        this.browserRenderTimes.length = 0;
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
        const averageRafInterval = average(rafIntervals);

        const snapshot: BenchmarkSnapshot = {
            suiteId: runLabel?.suiteId ?? null,
            runIndex: runLabel?.runIndex ?? null,
            codeVersion: __CODE_VERSION__,
            renderer: recordingRenderer,
            durationMs,
            frameCount: samples.length,
            averageFps: averageRafInterval > 0 ? 1000 / averageRafInterval : 0,
            low1PercentFps: this.calculateLow1PercentFps(rafIntervals),
            averageFrameTime: average(samples.map((sample) => sample.frameTime)),
            p95FrameTime: percentile(
                samples.map((sample) => sample.frameTime),
                95,
            ),
            averageRafInterval,
            p95RafInterval: percentile(rafIntervals, 95),
            averageSimulationTime: average(samples.map((sample) => sample.simulationTime)),
            p95SimulationTime: percentile(
                samples.map((sample) => sample.simulationTime),
                95,
            ),
            averageRenderTime: average(samples.map((sample) => sample.renderTime)),
            p95RenderTime: percentile(
                samples.map((sample) => sample.renderTime),
                95,
            ),
            averageBrowserRenderTime:
                this.browserRenderTimes.length === 0 ? null : average(this.browserRenderTimes),
            p95BrowserRenderTime:
                this.browserRenderTimes.length === 0
                    ? null
                    : percentile(this.browserRenderTimes, 95),
            averageGpuTime: this.gpuTimes.length === 0 ? null : average(this.gpuTimes),
            p95GpuTime: this.gpuTimes.length === 0 ? null : percentile(this.gpuTimes, 95),
            peakGpuTime: this.gpuTimes.length === 0 ? null : Math.max(...this.gpuTimes),
            averageMainThreadUtilization: average(
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

        if (rafInterval !== null) {
            this.liveRafIntervals.push(rafInterval);

            if (this.liveRafIntervals.length > this.liveRafIntervalLimit) {
                this.liveRafIntervals.shift();
            }
        }

        const averageLiveRafInterval = average(this.liveRafIntervals);
        const fps = averageLiveRafInterval > 0 ? 1000 / averageLiveRafInterval : 0;

        /*
         * This is the percentage of the real frame interval spent by:
         *
         *   simulation + renderer
         *
         * It is not total browser main-thread utilization.
         */
        const appTime = simulationTime + renderTime;
        const frameBudget = Math.max(rafInterval ?? safeFrameTime, 0.001);
        const mainThreadUtilization = Math.min(100, Math.max(0, (appTime / frameBudget) * 100));

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
            browserRenderTimeMs: this.latestBrowserRenderTimeMs,
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

    private calculateLow1PercentFps(rafIntervals: readonly number[]): number {
        if (rafIntervals.length === 0) {
            return 0;
        }

        const sortedIntervals = [...rafIntervals].sort((a, b) => b - a);

        const count = Math.max(1, Math.ceil(sortedIntervals.length * 0.01));

        const slowestFrames = sortedIntervals.slice(0, count);
        const averageSlowInterval = average(slowestFrames);

        return averageSlowInterval > 0 ? 1000 / averageSlowInterval : 0;
    }
}
