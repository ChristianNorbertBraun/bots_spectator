export interface Point {
    x: number;
    y: number;
}

export interface Dimension {
    width: number;
    height: number;
}

export const isEqualDimension = (a: Dimension, b: Dimension) => a.width === b.width && a.height === b.height;

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

