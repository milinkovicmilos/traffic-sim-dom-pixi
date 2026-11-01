import type { RendererType } from '@rendering/renderer-factory';
import type { BenchmarkMonitor, BenchmarkSnapshot } from './benchmark-monitor';
import type { BenchmarkSuiteConfig } from './benchmark-suite-config';
import type { SimulationTraceInfo } from './simulation-trace';

export interface BenchmarkSuiteSetup {
    id: string;
    name: string;
    rows: number;
    columns: number;
    vehicleCount: number;
}

export type BenchmarkSuiteRunStatus = 'complete' | 'skipped' | 'failed';

export interface BenchmarkSuiteRunResult {
    setup: BenchmarkSuiteSetup;
    renderer: RendererType;
    status: BenchmarkSuiteRunStatus;
    snapshot: BenchmarkSnapshot | null;
    trace?: SimulationTraceInfo;
    reason: string | null;
}

export interface BenchmarkSuiteProgress {
    completedRuns: number;
    totalRuns: number;
    setup: BenchmarkSuiteSetup;
    renderer: RendererType;
    phase: 'reset' | 'warmup' | 'recording';
}

export interface BenchmarkSuiteRunnerCallbacks {
    // Resolves to null when the renderer is unavailable.
    prepareRun: (
        setup: BenchmarkSuiteSetup,
        renderer: RendererType,
        seed: number,
        timelineMs: number,
    ) => Promise<SimulationTraceInfo | null>;
    getVehicleCount: () => number;
}

export interface BenchmarkSuiteRunOptions {
    runIndex: number;
    onProgress?: (progress: BenchmarkSuiteProgress) => void;
}

export class BenchmarkSuiteRunner {
    private readonly monitor: BenchmarkMonitor;
    private readonly callbacks: BenchmarkSuiteRunnerCallbacks;
    private running = false;

    constructor(monitor: BenchmarkMonitor, callbacks: BenchmarkSuiteRunnerCallbacks) {
        this.monitor = monitor;
        this.callbacks = callbacks;
    }

    isRunning(): boolean {
        return this.running;
    }

    async run(
        config: BenchmarkSuiteConfig,
        options: BenchmarkSuiteRunOptions,
    ): Promise<BenchmarkSuiteRunResult[]> {
        if (this.running) {
            throw new Error('A benchmark suite is already running.');
        }

        this.validateConfig(config);
        this.running = true;

        const results: BenchmarkSuiteRunResult[] = [];
        const runLabel = { suiteId: config.id, runIndex: options.runIndex };
        const totalRuns = config.setups.length * config.renderers.length;

        let completedRuns = 0;

        try {
            for (const setup of config.setups) {
                for (const renderer of config.renderers) {
                    options.onProgress?.({
                        completedRuns,
                        totalRuns,
                        setup,
                        renderer,
                        phase: 'reset',
                    });

                    let trace: SimulationTraceInfo | null = null;

                    try {
                        trace = await this.callbacks.prepareRun(
                            setup,
                            renderer,
                            config.seed,
                            config.warmupMs + config.durationMs,
                        );
                    } catch (error) {
                        results.push({
                            setup,
                            renderer,
                            status: 'failed',
                            snapshot: null,
                            reason: getErrorMessage(error),
                        });

                        completedRuns += 1;
                        continue;
                    }

                    if (!trace) {
                        results.push({
                            setup,
                            renderer,
                            status: 'skipped',
                            snapshot: null,
                            reason: `${renderer} is unavailable.`,
                        });

                        completedRuns += 1;
                        continue;
                    }

                    if (config.warmupMs > 0) {
                        options.onProgress?.({
                            completedRuns,
                            totalRuns,
                            setup,
                            renderer,
                            phase: 'warmup',
                        });

                        await wait(config.warmupMs);
                    }

                    options.onProgress?.({
                        completedRuns,
                        totalRuns,
                        setup,
                        renderer,
                        phase: 'recording',
                    });

                    try {
                        this.monitor.startRecording(renderer);

                        await wait(config.durationMs);

                        const snapshot = this.monitor.stopRecording(
                            renderer,
                            this.callbacks.getVehicleCount(),
                            setup.rows,
                            setup.columns,
                            runLabel,
                        );

                        results.push({
                            setup,
                            renderer,
                            status: 'complete',
                            // A replayed frame runs no simulation, so its cost comes from the trace.
                            snapshot: {
                                ...snapshot,
                                averageSimulationTime: trace.averageStepTime,
                                p95SimulationTime: trace.p95StepTime,
                            },
                            trace,
                            reason: null,
                        });
                    } catch (error) {
                        if (this.monitor.isRecording()) {
                            try {
                                this.monitor.stopRecording(
                                    renderer,
                                    this.callbacks.getVehicleCount(),
                                    setup.rows,
                                    setup.columns,
                                );
                            } catch {
                                // Ignore cleanup errors.
                            }
                        }

                        results.push({
                            setup,
                            renderer,
                            status: 'failed',
                            snapshot: null,
                            reason: getErrorMessage(error),
                        });

                        completedRuns += 1;
                        continue;
                    }

                    completedRuns += 1;
                }
            }

            return results;
        } finally {
            this.running = false;
        }
    }

    private validateConfig(config: BenchmarkSuiteConfig): void {
        if (!Number.isInteger(config.seed) || config.seed < 0) {
            throw new Error('Benchmark suite seed must be a non-negative integer.');
        }

        if (!Number.isInteger(config.warmupMs) || config.warmupMs < 0) {
            throw new Error('Benchmark warmup duration must be a non-negative integer.');
        }

        if (!Number.isInteger(config.durationMs) || config.durationMs <= 0) {
            throw new Error('Benchmark recording duration must be a positive integer.');
        }

        if (config.renderers.length === 0) {
            throw new Error('At least one renderer must be selected.');
        }

        if (config.setups.length === 0) {
            throw new Error('At least one benchmark setup is required.');
        }

        for (const setup of config.setups) {
            if (!Number.isInteger(setup.rows) || setup.rows < 2) {
                throw new Error(`Setup "${setup.name}" has an invalid row count.`);
            }

            if (!Number.isInteger(setup.columns) || setup.columns < 2) {
                throw new Error(`Setup "${setup.name}" has an invalid column count.`);
            }

            if (!Number.isInteger(setup.vehicleCount) || setup.vehicleCount < 1) {
                throw new Error(`Setup "${setup.name}" has an invalid vehicle count.`);
            }
        }
    }
}

export function wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
