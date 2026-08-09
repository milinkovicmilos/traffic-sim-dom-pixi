export const NodeType = {
    Corner: 'Corner',
    TJunction: 'TJunction',
    FourWayIntersection: 'FourWayIntersection',
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];
