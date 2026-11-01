interface GPUAdapterWithLegacyInfo extends GPUAdapter {
    // Removed from the spec in favour of adapter.info; older Chromium still only has this.
    requestAdapterInfo?: () => Promise<GPUAdapterInfo>;
}

export function getWebGlGpuName(gl: WebGLRenderingContext | WebGL2RenderingContext): string | null {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    // Firefox deprecates the extension but already reports the unmasked name through RENDERER.
    const name: unknown = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);

    return typeof name === 'string' && name.length > 0 ? name : null;
}

export async function getWebGpuGpuName(adapter: GPUAdapter): Promise<string | null> {
    const legacyAdapter = adapter as GPUAdapterWithLegacyInfo;
    let info: GPUAdapterInfo | undefined = adapter.info;

    if (!info && legacyAdapter.requestAdapterInfo) {
        try {
            info = await legacyAdapter.requestAdapterInfo();
        } catch {
            return null;
        }
    }

    if (!info) {
        return null;
    }

    if (info.description) {
        return info.description;
    }

    const name = [info.vendor, info.architecture, info.device].filter(Boolean).join(' ');

    return name.length > 0 ? name : null;
}

// Used when the active renderer has no GPU context of its own (DOM).
export function probeWebGlGpuName(): string | null {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');

    if (!gl) {
        return null;
    }

    try {
        return getWebGlGpuName(gl);
    } finally {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
