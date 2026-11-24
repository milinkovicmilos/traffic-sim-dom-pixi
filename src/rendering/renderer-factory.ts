import type { Renderer } from './renderer';

import { DOMRenderer, type DOMRendererOptions } from './dom/dom-renderer';

import { PixiRenderer, type PixiRendererOptions } from './pixi/pixi-renderer';

export type RendererType = 'dom' | 'dom-cull' | 'pixi-webgl' | 'pixi-webgpu';

export interface RendererOptions {
    dom: DOMRendererOptions;
    domCull: DOMRendererOptions;
    pixiWebgl: PixiRendererOptions;
    pixiWebgpu: PixiRendererOptions;
}

export function createRenderer(type: RendererType, options: RendererOptions): Renderer {
    switch (type) {
        case 'dom':
            return new DOMRenderer({ ...options.dom, culling: false });

        case 'dom-cull':
            return new DOMRenderer({ ...options.domCull, culling: true });

        case 'pixi-webgl':
            return new PixiRenderer({
                ...options.pixiWebgl,
                preference: 'webgl',
            });

        case 'pixi-webgpu':
            return new PixiRenderer({
                ...options.pixiWebgpu,
                preference: 'webgpu',
            });

        default:
            throw new Error(`Unsupported renderer: ${type}`);
    }
}
