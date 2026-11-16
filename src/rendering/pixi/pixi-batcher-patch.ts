import { DefaultBatcher } from 'pixi.js';

/*
 * Every DefaultBatcher shares one module-level shader, built with the texture count of the
 * first renderer that created a batcher. Batchers created later reuse it even when their own
 * renderer has a different maxBatchableTextures. With the WebGL and WebGPU renderers alive on
 * one page and a WebGL batch limit above 16 (common on Windows/ANGLE), WebGPU then draws with
 * a shader expecting more textures than its 16-slot bind groups hold, and fails with
 * "[BindGroup] the resource bound as 'textureSource17' was destroyed".
 *
 * Before each build, swap in a shader matching this batcher's own maxTextures. It is a no-op
 * once they match.
 */
const begin = DefaultBatcher.prototype.begin;

DefaultBatcher.prototype.begin = function (this: DefaultBatcher): void {
    this._updateMaxTextures(this.maxTextures);
    begin.call(this);
};
