import {Dimension} from "./geom";
import {vec3} from "gl-matrix";

const torusInnerRadius = 0.5;
const torusOuterRadius = 1.2; // This size still fits nicely in the view

const tmpVec = vec3.create();
const origin = vec3.create();

type VecFunc = (mapDim: Dimension, x: number, y: number) => vec3;

const createVertexBuffer = (posFunc: VecFunc) => (gl: WebGLRenderingContext, mapDim: Dimension): WebGLBuffer => {
    const buf = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const data = new Float32Array(mapDim.width * mapDim.height * 4 * 3);

    function setVec(index: number, v: vec3) {
        data[index * 3] = v[0];
        data[index * 3 + 1] = v[1];
        data[index * 3 + 2] = v[2];
    }

    for (let y = 0; y < mapDim.height; ++y) {
        for (let x = 0; x < mapDim.width; ++x) {
            const off = (y * mapDim.width + x) * 4;
            setVec(off, posFunc(mapDim, x, y + 1));
            setVec(off + 1, posFunc(mapDim, x, y));
            setVec(off + 2, posFunc(mapDim, x + 1, y + 1));
            setVec(off + 3, posFunc(mapDim, x + 1, y));
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
};

const torusPos: VecFunc = (mapDim: Dimension, x: number, y: number) => {
    const normX = (2 * x / mapDim.width) - 1;
    const normY = (2 * y / mapDim.height) - 1;
    const v = vec3.set(tmpVec, 0, 0, (torusOuterRadius - torusInnerRadius) * 0.5);
    vec3.rotateY(v, v, origin, normX * Math.PI);
    vec3.add(v, v, [torusOuterRadius * 0.5, 0, 0]);
    vec3.rotateZ(v, v, origin, normY * Math.PI);
    return v;
};

const torusNormal: VecFunc = (mapDim: Dimension, x: number, y: number) => {
    const normX = (2 * x / mapDim.width) - 1;
    const normY = (2 * y / mapDim.height) - 1;
    const v = vec3.set(tmpVec, 0, 0, 1);
    vec3.rotateY(v, v, origin, normX * Math.PI);
    vec3.rotateZ(v, v, origin, normY * Math.PI);
    return v;
};

const planePos: VecFunc = (mapDim: Dimension, x: number, y: number) => {
    const normX = (2 * x / mapDim.width) - 1;
    const normY = (2 * y / mapDim.height) - 1;
    return vec3.set(tmpVec, normX, normY, 0);
};

export const createTorusPosVertexBuffer: (gl: WebGLRenderingContext, mapDim: Dimension) => WebGLBuffer = createVertexBuffer(torusPos);
export const createTorusNormalVertexBuffer: (gl: WebGLRenderingContext, mapDim: Dimension) => WebGLBuffer = createVertexBuffer(torusNormal);
export const createPlanePosVertexBuffer: (gl: WebGLRenderingContext, mapDim: Dimension) => WebGLBuffer = createVertexBuffer(planePos);
