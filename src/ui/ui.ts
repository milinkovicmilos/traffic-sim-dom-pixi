import type { BenchmarkSnapshot } from '@benchmarking/benchmark-monitor';
import type { BenchmarkSuiteRunResult } from '@benchmarking/benchmark-suite';
import type { BenchmarkSuiteConfig } from '@benchmarking/benchmark-suite-config';
import type { RendererType } from '@rendering/renderer-factory';

export interface AppElements {
    simulationRoot: HTMLElement;
    rendererSelect: HTMLSelectElement;
    rowsInput: HTMLInputElement;
    columnsInput: HTMLInputElement;
    vehiclesInput: HTMLInputElement;
    domRendererHost: HTMLDivElement;
    pixiWebglRendererHost: HTMLDivElement;
    pixiWebgpuRendererHost: HTMLDivElement;
    benchmarkRecord: HTMLButtonElement;
    benchmarkConfigure: HTMLButtonElement;
    benchmarkSuiteRun: HTMLButtonElement;
    benchmarkStatus: HTMLElement;
    benchmarkCurrent: HTMLElement;
    benchmarkSnapshot: HTMLElement;
    benchmarkConfigModal: HTMLDivElement;
    benchmarkResultsModal: HTMLDivElement;
    benchmarkConfigClose: HTMLButtonElement;
    benchmarkConfigCancel: HTMLButtonElement;
    benchmarkConfigRun: HTMLButtonElement;
    suiteWarmupInput: HTMLInputElement;
    suiteDurationInput: HTMLInputElement;
    suiteRendererOptions: HTMLDivElement;
    suiteSetups: HTMLDivElement;
    suiteAddSetup: HTMLButtonElement;
    benchmarkResultsClose: HTMLButtonElement;
    benchmarkResultsFooterClose: HTMLButtonElement;
    benchmarkResultsCopy: HTMLButtonElement;
    benchmarkResultsContent: HTMLDivElement;
    benchmarkResultsSummary: HTMLElement;
}

export function renderApp(
    app: HTMLDivElement,
    gridRows: number,
    gridColumns: number,
    vehicleCount: number,
): AppElements {
    app.innerHTML = `
        <div class="simulation-toolbar">
            <div class="simulation-toolbar-left">
                <h1 class="simulation-title">Traffic Simulation</h1>
                <div class="scenario-controls">
                    <label class="scenario-control">
                        <span>Rows</span>
                        <input
                            id="rows-input"
                            type="number"
                            min="2"
                            step="1"
                            value="${gridRows}"
                            inputmode="numeric"
                        />
                    </label>
                    <label class="scenario-control">
                        <span>Columns</span>
                        <input
                            id="columns-input"
                            type="number"
                            min="2"
                            step="1"
                            value="${gridColumns}"
                            inputmode="numeric"
                        />
                    </label>
                    <label class="scenario-control">
                        <span>Vehicles</span>
                        <input
                            id="vehicles-input"
                            type="number"
                            min="1"
                            step="1"
                            value="${vehicleCount}"
                            inputmode="numeric"
                        />
                    </label>
                </div>
            </div>

            <label class="renderer-selector">
                <span>Renderer</span>
                <select id="renderer-select">
                    <option value="dom">DOM</option>
                    <option value="pixi-webgl">PixiJS WebGL</option>
                    <option value="pixi-webgpu">PixiJS WebGPU</option>
                </select>
            </label>
        </div>

        <div class="simulation-body">
            <div class="simulation-main">
                <div id="simulation-root" class="simulation-scroll">
                    <div id="simulation-content" class="simulation-content">
                        <div id="dom-renderer-host" class="renderer-host"></div>
                        <div id="pixi-webgl-renderer-host" class="renderer-host"></div>
                        <div id="pixi-webgpu-renderer-host" class="renderer-host"></div>
                    </div>
                </div>
            </div>

            <aside id="benchmark-panel" class="benchmark-panel">
                <div class="benchmark-panel-header">
                    <div>
                        <h2>Benchmark</h2>
                        <span id="benchmark-status" class="benchmark-status">Live</span>
                    </div>

                    <div class="benchmark-panel-actions">
                        <button
                            id="benchmark-configure"
                            class="benchmark-record-button"
                            type="button"
                        >
                            Configure Suite
                        </button>
                        <button
                            id="benchmark-suite-run"
                            class="benchmark-record-button benchmark-primary-button"
                            type="button"
                        >
                            Run Standard Suite
                        </button>
                        <button
                            id="benchmark-record"
                            class="benchmark-record-button"
                            type="button"
                        >
                            Record Snapshot
                        </button>
                    </div>
                </div>

                <section class="benchmark-section">
                    <h3>Current</h3>
                    <div id="benchmark-current" class="benchmark-grid"></div>
                </section>

                <section class="benchmark-section">
                    <h3>Snapshot</h3>
                    <div id="benchmark-snapshot" class="benchmark-snapshot">
                        <div class="benchmark-empty">No snapshot recorded.</div>
                    </div>
                </section>
            </aside>
        </div>

        <div id="benchmark-config-modal" class="benchmark-modal" hidden>
            <div
                class="benchmark-modal-backdrop"
                data-close-modal="benchmark-config-modal"
            ></div>

            <div
                class="benchmark-modal-dialog benchmark-config-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="benchmark-config-title"
            >
                <div class="benchmark-modal-header">
                    <div>
                        <h2 id="benchmark-config-title">Custom Benchmark Suite</h2>
                        <p>Configure a custom benchmark sequence and scenario setups.</p>
                    </div>

                    <button
                        id="benchmark-config-close"
                        class="benchmark-modal-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div class="benchmark-config-content">
                    <div class="benchmark-config-global">
                        <label class="benchmark-config-field">
                            <span>Warmup (ms)</span>
                            <input
                                id="suite-warmup-input"
                                type="number"
                                min="0"
                                step="500"
                            />
                        </label>

                        <label class="benchmark-config-field">
                            <span>Recording (ms)</span>
                            <input
                                id="suite-duration-input"
                                type="number"
                                min="100"
                                step="500"
                            />
                        </label>
                    </div>

                    <div class="benchmark-config-group">
                        <div class="benchmark-config-group-header">
                            <div>
                                <h3>Renderers</h3>
                                <span>Runs are executed in the order shown.</span>
                            </div>
                        </div>

                        <div
                            id="suite-renderer-options"
                            class="benchmark-renderer-options"
                        ></div>
                    </div>

                    <div class="benchmark-config-group">
                        <div class="benchmark-config-group-header">
                            <div>
                                <h3>Scenario setups</h3>
                                <span>Each setup runs once per selected renderer.</span>
                            </div>

                            <button
                                id="suite-add-setup"
                                class="benchmark-record-button"
                                type="button"
                            >
                                Add Setup
                            </button>
                        </div>

                        <div id="suite-setups" class="benchmark-setups"></div>
                    </div>
                </div>

                <div class="benchmark-modal-footer">
                    <button
                        id="benchmark-config-cancel"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Close
                    </button>
                    <button
                        id="benchmark-config-run"
                        class="benchmark-record-button benchmark-primary-button"
                        type="button"
                    >
                        Run Custom Suite
                    </button>
                </div>
            </div>
        </div>

        <div id="benchmark-results-modal" class="benchmark-modal" hidden>
            <div
                class="benchmark-modal-backdrop"
                data-close-modal="benchmark-results-modal"
            ></div>

            <div
                class="benchmark-modal-dialog benchmark-results-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="benchmark-results-title"
            >
                <div class="benchmark-modal-header">
                    <div>
                        <h2 id="benchmark-results-title">Benchmark Results</h2>
                        <p id="benchmark-results-summary"></p>
                    </div>

                    <button
                        id="benchmark-results-close"
                        class="benchmark-modal-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div
                    id="benchmark-results-content"
                    class="benchmark-results-content"
                ></div>

                <div class="benchmark-modal-footer">
                    <button
                        id="benchmark-results-copy"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Copy JSON
                    </button>
                    <button
                        id="benchmark-results-footer-close"
                        class="benchmark-record-button benchmark-primary-button"
                        type="button"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    const elements: AppElements = {
        simulationRoot: getRequiredElement('#simulation-content'),
        rendererSelect: getRequiredElement('#renderer-select'),
        rowsInput: getRequiredElement('#rows-input'),
        columnsInput: getRequiredElement('#columns-input'),
        vehiclesInput: getRequiredElement('#vehicles-input'),
        domRendererHost: getRequiredElement('#dom-renderer-host'),
        pixiWebglRendererHost: getRequiredElement('#pixi-webgl-renderer-host'),
        pixiWebgpuRendererHost: getRequiredElement('#pixi-webgpu-renderer-host'),
        benchmarkRecord: getRequiredElement('#benchmark-record'),
        benchmarkConfigure: getRequiredElement('#benchmark-configure'),
        benchmarkSuiteRun: getRequiredElement('#benchmark-suite-run'),
        benchmarkStatus: getRequiredElement('#benchmark-status'),
        benchmarkCurrent: getRequiredElement('#benchmark-current'),
        benchmarkSnapshot: getRequiredElement('#benchmark-snapshot'),
        benchmarkConfigModal: getRequiredElement('#benchmark-config-modal'),
        benchmarkResultsModal: getRequiredElement('#benchmark-results-modal'),
        benchmarkConfigClose: getRequiredElement('#benchmark-config-close'),
        benchmarkConfigCancel: getRequiredElement('#benchmark-config-cancel'),
        benchmarkConfigRun: getRequiredElement('#benchmark-config-run'),
        suiteWarmupInput: getRequiredElement('#suite-warmup-input'),
        suiteDurationInput: getRequiredElement('#suite-duration-input'),
        suiteRendererOptions: getRequiredElement('#suite-renderer-options'),
        suiteSetups: getRequiredElement('#suite-setups'),
        suiteAddSetup: getRequiredElement('#suite-add-setup'),
        benchmarkResultsClose: getRequiredElement('#benchmark-results-close'),
        benchmarkResultsFooterClose: getRequiredElement('#benchmark-results-footer-close'),
        benchmarkResultsCopy: getRequiredElement('#benchmark-results-copy'),
        benchmarkResultsContent: getRequiredElement('#benchmark-results-content'),
        benchmarkResultsSummary: getRequiredElement('#benchmark-results-summary'),
    };

    elements.simulationRoot.style.position = 'relative';

    return elements;
}

export class BenchmarkUi {
    private lastUpdated = 0;
    private readonly elements: AppElements;
    private readonly getEnvironment: () => {
        logicalProcessors: number;
        deviceMemoryGb: number | null;
    };

    constructor(
        elements: AppElements,
        getEnvironment: () => {
            logicalProcessors: number;
            deviceMemoryGb: number | null;
        },
    ) {
        this.elements = elements;
        this.getEnvironment = getEnvironment;
    }

    renderCurrent(
        now: number,
        renderer: RendererType,
        metrics: {
            fps: number;
            frameTimeMs: number;
            simulationTimeMs: number;
            renderTimeMs: number;
            gpuTimeMs: number | null;
            mainThreadUtilization: number;
            memoryMb: number | null;
            frameCount: number;
        },
    ): void {
        if (now - this.lastUpdated < 250) {
            return;
        }

        this.lastUpdated = now;

        this.elements.benchmarkCurrent.innerHTML = `
            ${metric('Renderer', getRendererLabel(renderer))}
            ${metric('FPS', metrics.fps.toFixed(1))}
            ${metric('Frame Time', `${metrics.frameTimeMs.toFixed(2)} ms`)}
            ${metric('Simulation Time', `${metrics.simulationTimeMs.toFixed(2)} ms`)}
            ${metric('Renderer Time', `${metrics.renderTimeMs.toFixed(2)} ms`)}
            ${metric(
                'GPU Time',
                metrics.gpuTimeMs === null ? 'N/A' : `${metrics.gpuTimeMs.toFixed(2)} ms`,
            )}
            ${metric('Main Thread', `${metrics.mainThreadUtilization.toFixed(1)}%`)}
            ${metric(
                'JS Heap (Chromium only)',
                metrics.memoryMb === null ? 'N/A' : `${metrics.memoryMb.toFixed(1)} MB`,
            )}
            ${metric('Frame Count', String(metrics.frameCount))}
            ${metric('CPU Cores', String(this.getEnvironment().logicalProcessors))}
        `;
    }

    renderSnapshot(snapshot: BenchmarkSnapshot | null): void {
        if (!snapshot) {
            this.elements.benchmarkSnapshot.innerHTML = `
                <div class="benchmark-empty">
                    No snapshot recorded.
                </div>
            `;
            return;
        }

        const environment = snapshot.environment;

        this.elements.benchmarkSnapshot.innerHTML = `
            <div class="benchmark-snapshot-meta">
                <span>${escapeHtml(getRendererLabel(snapshot.renderer))}</span>
                <span>${(snapshot.durationMs / 1000).toFixed(1)}s</span>
            </div>

            <div class="benchmark-grid">
                ${metric('Avg FPS', snapshot.averageFps.toFixed(1))}
                ${metric('1% low FPS', snapshot.low1PercentFps.toFixed(1))}
                ${metric('Avg Frame Time', `${snapshot.averageFrameTime.toFixed(2)} ms`)}
                ${metric('P95 Frame Time', `${snapshot.p95FrameTime.toFixed(2)} ms`)}
                ${metric('Avg Simulation', `${snapshot.averageSimulationTime.toFixed(2)} ms`)}
                ${metric('P95 Simulation', `${snapshot.p95SimulationTime.toFixed(2)} ms`)}
                ${metric('Avg Renderer', `${snapshot.averageRenderTime.toFixed(2)} ms`)}
                ${metric('P95 Renderer', `${snapshot.p95RenderTime.toFixed(2)} ms`)}
                ${metric('Avg GPU', formatGpuTime(snapshot.averageGpuTime))}
                ${metric('P95 GPU', formatGpuTime(snapshot.p95GpuTime))}
                ${metric('Peak GPU', formatGpuTime(snapshot.peakGpuTime))}
                ${metric('Avg Main Thread', `${snapshot.averageMainThreadUtilization.toFixed(1)}%`)}
                ${metric('Peak Main Thread', `${snapshot.peakMainThreadUtilization.toFixed(1)}%`)}
                ${metric('Memory Start', formatMemory(snapshot.memoryStartMb))}
                ${metric('Memory End', formatMemory(snapshot.memoryEndMb))}
                ${metric('Memory Peak', formatMemory(snapshot.memoryPeakMb))}
                ${metric('Vehicles', String(snapshot.vehicleCount))}
                ${metric('Map', `${snapshot.rows} × ${snapshot.columns}`)}
                ${metric('CPU Cores', String(environment.logicalProcessors))}
                ${metric(
                    'Device memory',
                    environment.deviceMemoryGb === null
                        ? 'N/A'
                        : `${environment.deviceMemoryGb} GB`,
                )}
            </div>

            <button
                id="benchmark-copy"
                class="benchmark-copy-button"
                type="button"
            >
                Copy Snapshot
            </button>
        `;

        this.elements.benchmarkSnapshot
            .querySelector<HTMLButtonElement>('#benchmark-copy')
            ?.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
                } catch {
                    console.warn('Could not copy benchmark snapshot to clipboard.');
                }
            });
    }

    renderResults(results: BenchmarkSuiteRunResult[]): void {
        const completeCount = results.filter((result) => result.status === 'complete').length;
        const skippedCount = results.filter((result) => result.status === 'skipped').length;
        const failedCount = results.filter((result) => result.status === 'failed').length;

        this.elements.benchmarkResultsSummary.textContent = `${completeCount} complete · ${skippedCount} skipped · ${failedCount} failed`;

        if (results.length === 0) {
            this.elements.benchmarkResultsContent.innerHTML = `
                <div class="benchmark-empty">
                    No benchmark results were produced.
                </div>
            `;
            return;
        }

        const rows = results
            .map((result) => {
                const snapshot = result.snapshot;
                const statusLabel =
                    result.status === 'complete'
                        ? 'Complete'
                        : result.status === 'skipped'
                          ? 'Skipped'
                          : 'Failed';

                if (!snapshot) {
                    return `
                    <tr>
                        <td>${escapeHtml(result.setup.name)}</td>
                        <td>${escapeHtml(getRendererLabel(result.renderer))}</td>
                        <td>
                            <span class="benchmark-result-status is-${result.status}">
                                ${statusLabel}
                            </span>
                        </td>
                        <td colspan="14">
                            ${escapeHtml(result.reason ?? '')}
                        </td>
                    </tr>
                `;
                }

                return `
                <tr>
                    <td>${escapeHtml(result.setup.name)}</td>
                    <td>${escapeHtml(getRendererLabel(result.renderer))}</td>
                    <td>
                        <span class="benchmark-result-status is-complete">
                            Complete
                        </span>
                    </td>
                    <td>${snapshot.rows} × ${snapshot.columns}</td>
                    <td>${snapshot.vehicleCount}</td>
                    <td>${snapshot.averageFps.toFixed(1)}</td>
                    <td>${snapshot.low1PercentFps.toFixed(1)}</td>
                    <td>${snapshot.averageFrameTime.toFixed(2)} ms</td>
                    <td>${snapshot.p95FrameTime.toFixed(2)} ms</td>
                    <td>${snapshot.averageSimulationTime.toFixed(2)} ms</td>
                    <td>${snapshot.p95SimulationTime.toFixed(2)} ms</td>
                    <td>${snapshot.averageRenderTime.toFixed(2)} ms</td>
                    <td>${formatGpuTime(snapshot.averageGpuTime)}</td>
                    <td>${formatGpuTime(snapshot.p95GpuTime)}</td>
                    <td>${snapshot.averageMainThreadUtilization.toFixed(1)}%</td>
                    <td>${formatMemory(snapshot.memoryPeakMb)}</td>
                </tr>
            `;
            })
            .join('');

        this.elements.benchmarkResultsContent.innerHTML = `
            <div class="benchmark-results-table-wrapper">
                <table class="benchmark-results-table">
                    <thead>
                        <tr>
                            <th>Setup</th>
                            <th>Renderer</th>
                            <th>Status</th>
                            <th>Map Size</th>
                            <th>Vehicles</th>
                            <th>Avg FPS</th>
                            <th>1% Low</th>
                            <th>Avg Frame</th>
                            <th>P95 Frame</th>
                            <th>Avg Sim</th>
                            <th>P95 Sim</th>
                            <th>Avg Render</th>
                            <th>Avg GPU</th>
                            <th>P95 GPU</th>
                            <th>Avg Main Thread</th>
                            <th>Memory Peak</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }
}

export function renderSuiteRendererOptions(
    container: HTMLDivElement,
    config: BenchmarkSuiteConfig,
    isRendererAvailable: (renderer: RendererType) => boolean,
): void {
    container.innerHTML = (['dom', 'pixi-webgl', 'pixi-webgpu'] as RendererType[])
        .map((renderer) => {
            const disabled = !isRendererAvailable(renderer);
            const checked = config.renderers.includes(renderer);

            return `
            <label class="benchmark-renderer-option">
                <input
                    type="checkbox"
                    data-suite-renderer="${renderer}"
                    ${checked && !disabled ? 'checked' : ''}
                    ${disabled ? 'disabled' : ''}
                />
                <span>${escapeHtml(getRendererLabel(renderer))}</span>
                ${disabled ? '<small>Unavailable</small>' : ''}
            </label>
        `;
        })
        .join('');
}

export function renderSuiteSetups(container: HTMLDivElement, config: BenchmarkSuiteConfig): void {
    container.innerHTML = config.setups
        .map(
            (setup, index) => `
        <div
            class="benchmark-setup-row"
            data-setup-id="${escapeHtml(setup.id)}"
        >
            <div class="benchmark-setup-index">${index + 1}</div>

            <label class="benchmark-config-field">
                <span>Name</span>
                <input
                    type="text"
                    data-field="name"
                    value="${escapeHtml(setup.name)}"
                />
            </label>

            <label class="benchmark-config-field">
                <span>Rows</span>
                <input
                    type="number"
                    min="2"
                    step="1"
                    data-field="rows"
                    value="${setup.rows}"
                />
            </label>

            <label class="benchmark-config-field">
                <span>Columns</span>
                <input
                    type="number"
                    min="2"
                    step="1"
                    data-field="columns"
                    value="${setup.columns}"
                />
            </label>

            <label class="benchmark-config-field">
                <span>Vehicles</span>
                <input
                    type="number"
                    min="1"
                    step="1"
                    data-field="vehicleCount"
                    value="${setup.vehicleCount}"
                />
            </label>

            <button
                class="benchmark-remove-setup"
                type="button"
                data-remove-setup="${escapeHtml(setup.id)}"
                ${config.setups.length <= 1 ? 'disabled' : ''}
            >
                Remove
            </button>
        </div>
    `,
        )
        .join('');
}

export function openModal(modal: HTMLDivElement): void {
    modal.hidden = false;
}

export function closeModal(modal: HTMLDivElement): void {
    modal.hidden = true;
}

export function getInput(container: HTMLElement, field: string): HTMLInputElement {
    const input = container.querySelector<HTMLInputElement>(`input[data-field="${field}"]`);

    if (!input) {
        throw new Error(`Could not find setup field: ${field}`);
    }

    return input;
}

export function getRendererLabel(type: RendererType): string {
    switch (type) {
        case 'dom':
            return 'DOM';
        case 'pixi-webgl':
            return 'PixiJS WebGL';
        case 'pixi-webgpu':
            return 'PixiJS WebGPU';
    }
}

export function metric(label: string, value: string): string {
    return `
        <div class="benchmark-metric">
            <span class="benchmark-metric-label">${escapeHtml(label)}</span>
            <strong class="benchmark-metric-value">${escapeHtml(value)}</strong>
        </div>
    `;
}

export function formatMemory(value: number | null): string {
    return value === null ? 'N/A' : `${value.toFixed(1)} MB`;
}

export function formatGpuTime(value: number | null): string {
    return value === null ? 'N/A' : `${value.toFixed(2)} ms`;
}

export function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getRequiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Could not find required element: ${selector}`);
    }

    return element;
}
