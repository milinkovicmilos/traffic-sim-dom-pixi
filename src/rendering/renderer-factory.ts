import type { Renderer } from './renderer';

import { DOMRenderer, type DOMRendererOptions } from './dom/dom-renderer';

export type RendererType = 'dom' | 'pixi';

export interface RendererOptions {
    dom: DOMRendererOptions;
}

export function createRenderer(type: RendererType, options: RendererOptions): Renderer {
    switch (type) {
        case 'dom':
            return new DOMRenderer(options.dom);

        default:
            throw new Error(`Unsupported renderer: ${type}`);
    }
}
