import type { RendererType } from '@rendering/renderer-factory';

import type { BenchmarkSnapshot, BenchmarkMonitor } from './benchmark-monitor';

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
    prepareRun: (setup: BenchmarkSuiteSetup, renderer: RendererType) => Promise<boolean>;

    getVehicleCount: () => number;
}

export interface BenchmarkSuiteRunOptions {
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
        options: BenchmarkSuiteRunOptions = {},
    ): Promise<BenchmarkSuiteRunResult[]> {
        if (this.running) {
            throw new Error('A benchmark suite is already running.');
        }

        this.validateConfig(config);

        this.running = true;

        const results: BenchmarkSuiteRunResult[] = [];

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

                    let prepared = false;

                    try {
                        prepared = await this.callbacks.prepareRun(setup, renderer);
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

                    if (!prepared) {
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

                    let snapshot: BenchmarkSnapshot | null = null;

                    try {
                        this.monitor.startRecording(renderer);

                        await wait(config.durationMs);

                        snapshot = this.monitor.stopRecording(
                            renderer,
                            this.callbacks.getVehicleCount(),
                            setup.rows,
                            setup.columns,
                        );
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
                                // Ignore cleanup failure.
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

                    results.push({
                        setup,
                        renderer,
                        status: 'complete',
                        snapshot,
                        reason: null,
                    });

                    completedRuns += 1;
                }
            }

            return results;
        } finally {
            this.running = false;
        }
    }

    private validateConfig(config: BenchmarkSuiteConfig): void {
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

function wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}
