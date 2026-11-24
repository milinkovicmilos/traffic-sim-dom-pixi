/*
 * Spatial chunks for culling static scene elements (roads, lane dividers, traffic lights).
 *
 * Shared by the PixiJS and DOM-cull renderers, so both hide exactly the same set:
 * same chunk size, same chunk bounds and the same margin around the same viewport.
 * All coordinates are scene coordinates (map position minus the map's minimum, plus padding).
 */

export const STATIC_CHUNK_SIZE = 2000;

// Chunk bounds are widened so elements that stick out of their cell (a road is keyed
// by its midpoint, a traffic light by its position) are still covered by the bounds.
export const STATIC_CHUNK_EXTENDED_MARGIN = 500;

// Extra area around the viewport that still counts as visible.
export const STATIC_CHUNK_CULL_MARGIN = 300;

export interface StaticChunkBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface StaticChunkCell {
    key: string;
    bounds: StaticChunkBounds;
}

export interface CullViewport {
    // Scene coordinate shown at the viewport's top-left corner (scroll offset / -camera).
    left: number;
    top: number;
    width: number;
    height: number;
}

export function getStaticChunkCell(x: number, y: number): StaticChunkCell {
    const chunkX = Math.floor(x / STATIC_CHUNK_SIZE);
    const chunkY = Math.floor(y / STATIC_CHUNK_SIZE);

    return {
        key: `${chunkX}:${chunkY}`,
        bounds: {
            minX: chunkX * STATIC_CHUNK_SIZE - STATIC_CHUNK_EXTENDED_MARGIN,
            minY: chunkY * STATIC_CHUNK_SIZE - STATIC_CHUNK_EXTENDED_MARGIN,
            maxX: (chunkX + 1) * STATIC_CHUNK_SIZE + STATIC_CHUNK_EXTENDED_MARGIN,
            maxY: (chunkY + 1) * STATIC_CHUNK_SIZE + STATIC_CHUNK_EXTENDED_MARGIN,
        },
    };
}

export function isStaticChunkVisible(bounds: StaticChunkBounds, viewport: CullViewport): boolean {
    const visibleMinX = viewport.left - STATIC_CHUNK_CULL_MARGIN;
    const visibleMinY = viewport.top - STATIC_CHUNK_CULL_MARGIN;
    const visibleMaxX = viewport.left + viewport.width + STATIC_CHUNK_CULL_MARGIN;
    const visibleMaxY = viewport.top + viewport.height + STATIC_CHUNK_CULL_MARGIN;

    return (
        bounds.maxX >= visibleMinX &&
        bounds.minX <= visibleMaxX &&
        bounds.maxY >= visibleMinY &&
        bounds.minY <= visibleMaxY
    );
}
