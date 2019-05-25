import {mat4} from "gl-matrix";
import {paletteColor5} from "./palette";
import chroma from "chroma-js";
import {Dimension, Point, Rect} from "./geom";

const vertexShaderSource = `
attribute vec2 a_pos;
attribute vec2 a_uv;
attribute vec4 a_tint;
uniform mat4 u_perspective;
varying vec2 v_uv;
varying vec4 v_tint;

void main() {
  gl_Position = u_perspective * vec4(a_pos, 1., 1.);
  v_uv = a_uv;
  v_tint = a_tint;
}
`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 v_uv;
varying vec4 v_tint;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_uv.st).rgba;
  gl_FragColor.rgb *= v_tint.rgb;
  gl_FragColor *= v_tint.a;
}
`;

const defaultTint = new Float32Array([1, 1, 1, 1]);

const tmpMat = mat4.create();

interface ProgramInfo {
    program: WebGLProgram,
    uvBuffer: WebGLBuffer,
    posAttribLoc: number,
    uvAttribLoc: number,
    tintAttribLoc: number,
    perspectiveUniformLoc: WebGLUniformLocation,
    textureUniformLoc: WebGLUniformLocation,
}

function compileShader(gl: WebGLRenderingContext, type: GLenum, src: string) {
    const shader = gl.createShader(type)!!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader
}

function initBuffers(gl: WebGLRenderingContext, program: WebGLProgram, atlas: HTMLImageElement): ProgramInfo {
    const posAttribLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posAttribLoc);

    const uvBuffer = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(calcUvCoords(atlas)), gl.STATIC_DRAW);

    const uvAttribLoc = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uvAttribLoc);
    const tintAttribLoc = gl.getAttribLocation(program, "a_tint");

    const perspectiveUniformLoc = gl.getUniformLocation(program, 'u_perspective')!!;
    const textureUniformLoc = gl.getUniformLocation(program, 'u_texture')!!;
    return {
        program,
        uvBuffer,
        posAttribLoc,
        uvAttribLoc,
        tintAttribLoc,
        perspectiveUniformLoc,
        textureUniformLoc,
    };
}

export function createVertexPosBuffer(gl: WebGLRenderingContext, mapDim: Dimension): WebGLBuffer {
    const buf = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const data = new Float32Array(mapDim.width * mapDim.height * 4 * 3);

    function setVec(index: number, v: number[]) {
        data[index * 3] = v[0];
        data[index * 3 + 1] = v[1];
        data[index * 3 + 2] = v[2];
        data[index * 3 + 3] = v[3];
    }

    for (let y = 0; y < mapDim.height; ++y) {
        for (let x = 0; x < mapDim.width; ++x) {
            const off = (y * mapDim.width + x) * 4;
            setVec(off, torusPosOf(mapDim, x, y + 1));
            setVec(off + 1, torusPosOf(mapDim, x, y));
            setVec(off + 2, torusPosOf(mapDim, x + 1, y + 1));
            setVec(off + 3, torusPosOf(mapDim, x + 1, y));
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
}

function torusPosOf(mapDim: Dimension, x: number, y: number): number[] {
    // TODO: really calc torus coords here
    return [x, y, 0];
}

export interface MyGL {
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    texture: WebGLTexture,
    initFrame: (mapDim: Dimension) => void,
}

export async function createMyGL(gl: WebGLRenderingContext): Promise<MyGL> {
    const atlas = await loadAtlas();
    const texture = createTextureFrom(gl, atlas);
    const program = gl.createProgram()!!;
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);
    const programInfo = initBuffers(gl, program, atlas);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const bgColor = chroma(paletteColor5).gl();
    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    return {
        gl,
        texture,
        programInfo,
        initFrame: (mapDim: Dimension) => initFrame(gl, programInfo, texture, mapDim),
    };
}

function initFrame(gl: WebGLRenderingContext, pi: ProgramInfo, texture: WebGLTexture, mapDim: Dimension) {
    const worldRect = {
        x: 0, y: 0, width: mapDim.width, height: mapDim.height,
    };
    resize(gl, pi, worldRect);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(pi.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(pi.textureUniformLoc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, pi.uvBuffer);
}

function createTextureFrom(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture {
    const id = gl.createTexture()!!;
    if (id < 1) {
        throw Error("Failed to create texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    return id;
}

async function loadAtlas(): Promise<HTMLImageElement> {
    const a = new Image();
    a.src = 'atlas.png';
    console.log("Loading atlas image...");
    return new Promise(resolve => {
        a.onload = () => {
            console.log("Loaded atlas successfully.");
            resolve(a);
        }
    });
}

function calcUvCoords(atlas: HTMLImageElement): number[] {
    const coords = [],
        xf = 1 / atlas.width,
        yf = 1 / atlas.height,
        nx = .5 * xf,
        ny = .5 * yf,
        tileSize = 16;
    for (let y = 0; y < atlas.height; y += tileSize) {
        for (let x = 0; x < atlas.width; x += tileSize) {
            const l = x * xf,
                t = y * yf,
                r = l + tileSize * xf,
                b = t + tileSize * yf;
            /* TRIANGLE_STRIP order:
             *   A--C   A: x, y
             *   | /|   B: x, y
             *   |/ |   C: x, y
             *   B--D   D: x, y */
            coords.push(
                l + nx, t + ny,
                l + nx, b - ny,
                r - nx, t + ny,
                r - nx, b - ny,
            )
        }
    }
    return coords;
}

export function drawSprite(gl: WebGLRenderingContext, pi: ProgramInfo, vertexPosBuffer: WebGLBuffer, mapDim: Dimension, sprite: number, tilePos: Point, tint: Float32Array = defaultTint) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.vertexAttribPointer(pi.posAttribLoc, 3, gl.FLOAT, false, 0, (tilePos.y * mapDim.width + tilePos.x) * 4 * 3 * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, pi.uvBuffer);
    gl.vertexAttribPointer(pi.uvAttribLoc, 2, gl.FLOAT, false, 0, sprite << 5);
    gl.vertexAttrib4fv(pi.tintAttribLoc, tint);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function resize(gl: WebGLRenderingContext, pi: ProgramInfo, worldRect: Rect) {
    const canvasWidth = gl.canvas.clientWidth;
    const canvasHeight = gl.canvas.clientHeight;
    gl.canvas.width = canvasWidth;
    gl.canvas.height = canvasHeight;
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    const scaleX = worldRect.width / canvasWidth;
    const scaleY = worldRect.height / canvasHeight;
    const scale = Math.max(scaleX, scaleY);

    // Canvas dimensions in world space
    const canvasWorldWidth = scale * canvasWidth;
    const canvasWorldHeight = scale * canvasHeight;

    const offX = (worldRect.width - canvasWorldWidth) / 2;
    const offY = (worldRect.height - canvasWorldHeight) / 2;

    const perspective = mat4.identity(tmpMat);
    mat4.ortho(
        perspective,
        offX + worldRect.x,
        offX + worldRect.x + scale * canvasWidth,
        offY + worldRect.y,
        offY + worldRect.y + scale * canvasHeight,
        -10,
        10,
    );

    gl.uniformMatrix4fv(pi.perspectiveUniformLoc, false, perspective);
}
