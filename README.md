# traffic-sim-dom-pixi

A traffic simulation on a grid of intersections, rendered three ways: DOM, PixiJS WebGL and PixiJS WebGPU. The built-in benchmark measures all three renderers on the same scenarios and exports the results as JSON.

## Running the app

You need Node.js (tested with v22) and npm.

```bash
npm install
npm run dev
```

Vite prints the app URL, e.g. `http://localhost:5173/traffic-sim-dom-pixi/`. Open it in the browser you want to measure.

Other commands:

| Command | Description |
|---|---|
| `npm run build` | Type check (`tsc`) and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `npm run lint:fix` | Run ESLint / apply automatic fixes |

The `codeVersion` field in the results comes from `git describe --tags --always --dirty` when the dev server or build starts. Outside a git repository it is `unknown`, and a `-dirty` suffix means there were uncommitted changes.

The top bar sets the grid rows and columns, the vehicle count and the renderer. PixiJS WebGPU is disabled when the browser does not support WebGPU.

Add `?noTimers=1` to the URL (e.g. `http://localhost:5173/traffic-sim-dom-pixi/?noTimers=1`) to hide the countdown text next to the traffic lights. The lights are still drawn and still change color in every renderer. The parameter applies to the live view, and is the default for new scenarios in a custom suite. In **Configure Suite**, the **Timers** checkbox turns timers on or off for each scenario. The standard suite ignores the parameter, because each of its scenarios sets timers on or off itself.

## Running the standard suite

1. In the **Benchmark** panel, enter the machine number in the **Host** field. It goes into the exported file name and is remembered by the browser.
2. Click **Run Standard Suite**.
3. Leave the window alone while the suite runs. Keep the tab visible and in the foreground, because browsers throttle or pause `requestAnimationFrame` in background tabs. Progress is shown next to the panel title.
4. When the suite finishes, a results table opens and the JSON downloads automatically as:

   ```
   H{host}_{Browser}_{version}_run{n}.json
   ```

   e.g. `H1_Firefox_160_run1.json`. `n` is the run number shown under the panel title (**Next standard run**). The **Copy JSON** button in the results window copies the same JSON to the clipboard.

### Run numbers and renderer order

Measuring the renderers always in the same order could bias the results (JIT warmup, caches, heat, memory), so the standard suite rotates the order between runs. Run `k` starts with renderer `(k - 1) mod 3`:

| Run | Order |
|---|---|
| 1, 4, 7, … | DOM → WebGL → WebGPU |
| 2, 5, 8, … | WebGL → WebGPU → DOM |
| 3, 6, 9, … | WebGPU → DOM → WebGL |

The run number is kept in the browser's local storage, so it survives closing the browser between runs. It goes up by one after a suite that ends without `failed` results (`skipped` ones are fine). A run with failures keeps its number, so repeating it repeats the same order. The counter starts over at 1 when the app version (`codeVersion`) changes, and **Reset Runs** starts it over manually, e.g. to record a series again. The counter is per browser, since each browser has its own storage.

A custom suite keeps the renderer order picked in its dialog and does not change the counter.

### What the suite measures

The standard suite is defined in `src/benchmarking/benchmark-suite-config.ts`:

| Group | Grid | Vehicles | Timers |
|---|---|---|---|
| `V` (vehicle count scaling) | 30×30 | 100, 250, 500, 1000, 2000, 4000, 8000, 16000 | on |
| `M` (map size scaling) | 10×10, 20×20, 40×40, 60×60 | 1000 | on |
| `S` (small scenarios) | 5×5, 10×10 | 100 | off |
| `P` (vehicle count scaling on a small map) | 10×10 | 100, 250, 500 | off |

"Timers off" means the traffic lights are drawn and change color, but without the countdown text. Text is expensive to render and would dominate small scenes, so without it groups `S` and `P` mostly measure the cost of drawing the scene's objects.


Each of the 17 scenarios runs on all three renderers, for **51 measurements**. A full suite takes about 12 minutes.

One suite run goes like this:

1. It measures `requestAnimationFrame` intervals for 2 s to estimate the display refresh rate.
2. For each scenario, it computes the simulation once up front, at a fixed step of 60 states per second with the fixed seed `123456789`. All three renderers then replay the same states, so they draw identical traffic.
3. Each renderer gets 3 s of warmup followed by 10 s of measurement, in the order of the current run (see above).
4. At the end, the previous scenario and renderer are restored.

Because the seed is fixed, `trace.stateHash` is the same for a given scenario on every machine and browser. You can use it to confirm that two measurements simulated the same thing.

### Custom suite

**Configure Suite** opens a dialog where you pick the renderers, the durations and your own scenarios. A custom suite gets a new random seed every time it runs and `suiteId: "custom"`. Its results are therefore not directly comparable with the standard suite: `stateHash` differs.

### Invalid measurements

A measurement with `frameCount` close to zero, or with `low1PercentFps` far below `averageFps`, usually means the browser stalled during the measurement. Run it again.

## JSON format

The file is an array of results, one per scenario and renderer combination, ordered scenario by scenario and, within each scenario, in the order the renderers ran (`rendererOrder`).

```jsonc
[
  {
    "setup": { "id": "V-30x30-100", "name": "30x30 • 100 vehicles", "rows": 30, "columns": 30, "vehicleCount": 100, "trafficLightTimers": true },
    "renderer": "pixi-webgl",
    "rendererOrder": ["dom", "pixi-webgl", "pixi-webgpu"],
    "rendererPosition": 2,
    "status": "complete",
    "snapshot": { /* metrics, see below */ },
    "trace": { "stateHash": "477ef3e9", "statesPerSecond": 60, "stateCount": 901, "averageStepTime": 0.14, "p95StepTime": 1 },
    "reason": null
  },
  {
    "setup": { "id": "V-30x30-100", /* ... */ },
    "renderer": "pixi-webgpu",
    "rendererOrder": ["dom", "pixi-webgl", "pixi-webgpu"],
    "rendererPosition": 3,
    "status": "skipped",
    "snapshot": null,
    "reason": "pixi-webgpu is unavailable."
  }
]
```

### Result

| Field | Type | Description |
|---|---|---|
| `setup` | object | The scenario: `id`, `name`, `rows`, `columns`, `vehicleCount`, `trafficLightTimers`. Standard scenario IDs have the form `{group}-{rows}x{columns}-{vehicles}`, with a `-notimers` suffix when `trafficLightTimers` is `false`. |
| `renderer` | string | `dom`, `pixi-webgl` or `pixi-webgpu` |
| `rendererOrder` | string[] | The order the renderers ran in within every scenario of this suite run |
| `rendererPosition` | number | This renderer's place in `rendererOrder`, starting at 1 |
| `status` | string | `complete`: measured; `skipped`: renderer unavailable; `failed`: error during preparation or measurement |
| `snapshot` | object \| `null` | The metrics; `null` unless the status is `complete` |
| `trace` | object | Information about the precomputed simulation; present only when the status is `complete` |
| `reason` | string \| `null` | Why the run was `skipped` / `failed`, otherwise `null` |

### `snapshot`

All times are in milliseconds. `average*` is the mean and `p95*` the 95th percentile over the frames recorded during the measurement.

| Field | Description |
|---|---|
| `suiteId` | `standard` or `custom` |
| `runIndex` | Suite number since the page was loaded (same as `run{n}` in the file name) |
| `codeVersion` | Code version (`git describe`) |
| `renderer` | The renderer that was measured |
| `durationMs` | Actual length of the measurement |
| `frameCount` | Frames recorded during the measurement |
| `averageFps` | `1000 / averageRafInterval` |
| `low1PercentFps` | FPS computed from the mean of the slowest 1% of `requestAnimationFrame` intervals |
| `averageFrameTime`, `p95FrameTime` | Time the app spends in one `requestAnimationFrame` callback |
| `averageRafInterval`, `p95RafInterval` | Time between consecutive `requestAnimationFrame` calls |
| `averageSimulationTime`, `p95SimulationTime` | Duration of one simulation step. In a suite these are copied from `trace` (`averageStepTime`, `p95StepTime`), because frames only replay precomputed states during the measurement |
| `averageRenderTime`, `p95RenderTime` | CPU time the renderer spends drawing a frame |
| `averageBrowserRenderTime`, `p95BrowserRenderTime` | Browser work after the callback (style, layout, paint) until the next task. `null` if there were no samples |
| `averageGpuTime`, `p95GpuTime`, `peakGpuTime` | GPU time from GPU timer queries. `null` when the renderer or browser does not support them (always for DOM) |
| `averageMainThreadUtilization`, `peakMainThreadUtilization` | (simulation + render) / `requestAnimationFrame` interval, as a percentage (0–100). Does not include the browser's own work |
| `memoryStartMb`, `memoryEndMb`, `memoryPeakMb` | JS heap (`performance.memory`). Chromium browsers only, otherwise `null` |
| `vehicleCount`, `rows`, `columns` | Actual scenario size during the measurement |
| `environment` | Machine information, see below |

### `snapshot.environment`

| Field | Description |
|---|---|
| `logicalProcessors` | `navigator.hardwareConcurrency` |
| `deviceMemoryGb` | `navigator.deviceMemory` (Chromium only, otherwise `null`) |
| `userAgent` | Browser user agent |
| `screenWidth`, `screenHeight`, `devicePixelRatio` | Screen |
| `viewportWidth`, `viewportHeight` | Size of the simulation area in CSS pixels |
| `gpuName` | GPU name reported by the renderer's own WebGL / WebGPU context. DOM has no context of its own, so its name comes from a separate WebGL probe. `null` when the context does not report a name, e.g. WebGPU in Firefox, which returns empty adapter info. |
| `pixiRendererName` | Renderer PixiJS actually created (`app.renderer.name`): `webgl` or `webgpu`; `null` for DOM. |
| `refreshRateEstimate` | Estimated display refresh rate in Hz, measured at the start of the suite |

### `trace`

| Field | Description |
|---|---|
| `stateHash` | Hash of all precomputed states. The same scenario with the same seed gives the same hash |
| `statesPerSecond` | Simulation states per second (60) |
| `stateCount` | Total number of precomputed states |
| `averageStepTime`, `p95StepTime` | Duration of one simulation step while the states were generated |
