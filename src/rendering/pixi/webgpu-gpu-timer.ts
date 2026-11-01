// Pixi usually renders one pass per frame; a frame needing more than this is discarded, not undercounted.
const MAX_TIMED_PASSES = 16;
const TIMESTAMPS_PER_PASS = 2;
const BYTES_PER_TIMESTAMP = 8;
const READBACK_BUFFER_COUNT = 4;

/*
 * Pixi does not request 'timestamp-query', so we create the device and hand it over.
 * The features and limits mirror GpuDeviceSystem._createDeviceAndAdaptor.
 *
 * Returns null when timing is unsupported, which leaves device creation to Pixi.
 */
export async function requestTimestampGpu(): Promise<{
    adapter: GPUAdapter;
    device: GPUDevice;
} | null> {
    try {
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter?.features.has('timestamp-query')) {
            return null;
        }

        const requiredFeatures = (
            [
                'texture-compression-bc',
                'texture-compression-astc',
                'texture-compression-etc2',
                'indirect-first-instance',
                'timestamp-query',
            ] as GPUFeatureName[]
        ).filter((feature) => adapter.features.has(feature));

        const device = await adapter.requestDevice({
            requiredFeatures,
            requiredLimits: {
                maxSampledTexturesPerShaderStage: adapter.limits.maxSampledTexturesPerShaderStage,
                maxSamplersPerShaderStage: adapter.limits.maxSamplersPerShaderStage,
            },
        });

        return { adapter, device };
    } catch {
        return null;
    }
}

/*
 * The WebGPU counterpart of the WebGL TIME_ELAPSED query: sums the GPU time of
 * every render pass between begin() and end(). Results arrive asynchronously.
 *
 * Its GPU resources are freed along with the device.
 */
export class WebGpuGpuTimer {
    private readonly device: GPUDevice;
    private readonly onSample: (gpuTimeMs: number) => void;
    private readonly querySet: GPUQuerySet;
    private readonly resolveBuffer: GPUBuffer;
    private readonly freeReadbackBuffers: GPUBuffer[];
    private active = false;
    private passCount = 0;
    private generation = 0;

    constructor(device: GPUDevice, onSample: (gpuTimeMs: number) => void) {
        this.device = device;
        this.onSample = onSample;

        const timestampCount = MAX_TIMED_PASSES * TIMESTAMPS_PER_PASS;
        const size = timestampCount * BYTES_PER_TIMESTAMP;

        this.querySet = device.createQuerySet({ type: 'timestamp', count: timestampCount });
        this.resolveBuffer = device.createBuffer({
            size,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        this.freeReadbackBuffers = Array.from({ length: READBACK_BUFFER_COUNT }, () =>
            device.createBuffer({
                size,
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
            }),
        );
    }

    begin(): void {
        // Every buffer still waiting on the GPU: skip this sample rather than stall.
        this.active = this.freeReadbackBuffers.length > 0;
        this.passCount = 0;
    }

    nextPassTimestampWrites(): GPURenderPassTimestampWrites | undefined {
        if (!this.active) {
            return undefined;
        }

        const beginningOfPassWriteIndex = this.passCount * TIMESTAMPS_PER_PASS;

        this.passCount += 1;

        if (this.passCount > MAX_TIMED_PASSES) {
            return undefined;
        }

        return {
            querySet: this.querySet,
            beginningOfPassWriteIndex,
            endOfPassWriteIndex: beginningOfPassWriteIndex + 1,
        };
    }

    // Must run after the frame was submitted, since resolving reads the written timestamps.
    end(): void {
        if (!this.active) {
            return;
        }

        this.active = false;

        const buffer = this.freeReadbackBuffers.pop();

        if (!buffer) {
            return;
        }

        if (this.passCount === 0 || this.passCount > MAX_TIMED_PASSES) {
            this.freeReadbackBuffers.push(buffer);
            return;
        }

        const timestampCount = this.passCount * TIMESTAMPS_PER_PASS;
        const size = timestampCount * BYTES_PER_TIMESTAMP;
        const encoder = this.device.createCommandEncoder();

        encoder.resolveQuerySet(this.querySet, 0, timestampCount, this.resolveBuffer, 0);
        encoder.copyBufferToBuffer(this.resolveBuffer, 0, buffer, 0, size);
        this.device.queue.submit([encoder.finish()]);

        void this.readResult(buffer, size);
    }

    // In-flight results belong to the previous run, so they are dropped when they arrive.
    reset(): void {
        this.generation += 1;
    }

    private async readResult(buffer: GPUBuffer, size: number): Promise<void> {
        const generation = this.generation;

        try {
            await buffer.mapAsync(GPUMapMode.READ, 0, size);

            const gpuTimeMs = this.sumPassTimes(new BigUint64Array(buffer.getMappedRange(0, size)));

            buffer.unmap();
            this.freeReadbackBuffers.push(buffer);

            if (gpuTimeMs !== null && generation === this.generation) {
                this.onSample(gpuTimeMs);
            }
        } catch {
            // Mapping fails when the device is destroyed or lost mid-read.
        }
    }

    private sumPassTimes(timestamps: BigUint64Array): number | null {
        let nanoseconds = 0n;

        for (let i = 0; i < timestamps.length; i += TIMESTAMPS_PER_PASS) {
            const start = timestamps[i];
            const end = timestamps[i + 1];

            // The spec allows timestamps to go backwards, which makes the sample meaningless.
            if (end < start) {
                return null;
            }

            nanoseconds += end - start;
        }

        return Number(nanoseconds) / 1_000_000;
    }
}
