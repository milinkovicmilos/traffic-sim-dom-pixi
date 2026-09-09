import type { Renderer } from './renderer';

import { DOMRenderer, type DOMRendererOptions } from './dom/dom-renderer';
import { PixiRenderer, type PixiRendererOptions } from './pixi/pixi-renderer';

export type RendererType = 'dom' | 'pixi';

export interface RendererOptions {
    dom: DOMRendererOptions;
    pixi: PixiRendererOptions;
}

export function createRenderer(type: RendererType, options: RendererOptions): Renderer {
    switch (type) {
        case 'dom':
            return new DOMRenderer(options.dom);

        case 'pixi':
            return new PixiRenderer(options.pixi);

        default:
            throw new Error(`Unsupported renderer: ${type}`);
    }
}
