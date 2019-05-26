import {mat4} from "gl-matrix";
import {paletteColor5} from "./palette";
import chroma from "chroma-js";
import {Dimension, Point} from "./geom";

const vertexShaderSource = `
attribute vec3 a_pos;
attribute vec3 a_normal;
attribute vec2 a_uv;
attribute vec4 a_tint;
uniform mat4 u_mv;
uniform mat4 u_mvp;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec4 v_tint;

void main() {
  gl_Position = u_mvp * vec4(a_pos, 1.);
  v_normal = vec3(u_mv * vec4(a_normal, 0.0));
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

varying vec3 v_normal;
varying vec2 v_uv;
varying vec4 v_tint;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_uv.st).rgba;
  gl_FragColor.rgb *= v_tint.rgb;
  gl_FragColor *= v_tint.a;
  float diffuse = dot(v_normal, vec3(0,0,1));
  float ambient = 0.2;
  gl_FragColor.rgb *= diffuse * 0.8 + ambient;
}
`;

const defaultTint = new Float32Array([1, 1, 1, 1]);

const mat4Tmp1 = mat4.create();
const mat4Tmp2 = mat4.create();

export interface MyGL {
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    atlasTexture: WebGLTexture,
}

export interface ProgramInfo {
    program: WebGLProgram,
    uvBuffer: WebGLBuffer,
    posAttribLoc: number,
    normalAttribLoc: number,
    uvAttribLoc: number,
    tintAttribLoc: number,
    mvUniformLoc: WebGLUniformLocation,
    mvpUniformLoc: WebGLUniformLocation,
    textureUniformLoc: WebGLUniformLocation,
}

function compileShader(gl: WebGLRenderingContext, type: GLenum, src: string) {
    const shader = gl.createShader(type)!!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
}

function initBuffers(gl: WebGLRenderingContext, program: WebGLProgram, atlas: HTMLImageElement): ProgramInfo {
    const posAttribLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posAttribLoc);
    const normalAttribLoc = gl.getAttribLocation(program, 'a_normal');

    const uvBuffer = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(calcUvCoords(atlas)), gl.STATIC_DRAW);

    const uvAttribLoc = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uvAttribLoc);
    const tintAttribLoc = gl.getAttribLocation(program, "a_tint");

    const mvUniformLoc = gl.getUniformLocation(program, 'u_mv')!!;
    const mvpUniformLoc = gl.getUniformLocation(program, 'u_mvp')!!;
    const textureUniformLoc = gl.getUniformLocation(program, 'u_texture')!!;
    return {
        program,
        uvBuffer,
        posAttribLoc,
        normalAttribLoc,
        uvAttribLoc,
        tintAttribLoc,
        mvUniformLoc,
        mvpUniformLoc,
        textureUniformLoc,
    };
}

export async function createMyGL(gl: WebGLRenderingContext): Promise<MyGL> {
    const atlas = await loadAtlas();
    const atlasTexture = createTextureFrom(gl, atlas);
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
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    return {
        gl,
        programInfo,
        atlasTexture,
    };
}

export function initFrame(myGL: MyGL, rotation: { x: number, y: number },) {
    const {gl, programInfo} = myGL;
    resize(gl, programInfo, rotation);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(programInfo.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, myGL.atlasTexture);
    gl.uniform1i(programInfo.textureUniformLoc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.uvBuffer);
}

function createTextureFrom(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture {
    const id = gl.createTexture()!!;
    if (id < 1) {
        throw Error("Failed to create atlasTexture");
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

const planeNormal = new Float32Array([0, 0, 1]);

export type DrawSpriteFunc = (sprite: number, pos: Point, tint?: Float32Array) => void;

export const drawSprite = (
    myGL: MyGL,
    mapDim: Dimension,
    posVertexBuffer: WebGLBuffer,
    normalVertexBuffer?: WebGLBuffer,
): DrawSpriteFunc => (sprite: number, pos: Point, tint: Float32Array = defaultTint) => {
    const {gl, programInfo} = myGL;
    gl.bindBuffer(gl.ARRAY_BUFFER, posVertexBuffer);
    gl.vertexAttribPointer(programInfo.posAttribLoc, 3, gl.FLOAT, false, 0, (pos.y * mapDim.width + pos.x) * 4 * 3 * 4);
    if (normalVertexBuffer) {
        gl.enableVertexAttribArray(programInfo.normalAttribLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalVertexBuffer);
        gl.vertexAttribPointer(programInfo.normalAttribLoc, 3, gl.FLOAT, false, 0, (pos.y * mapDim.width + pos.x) * 4 * 3 * 4);
    } else {
        gl.disableVertexAttribArray(programInfo.normalAttribLoc);
        gl.vertexAttrib3fv(programInfo.normalAttribLoc, planeNormal);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.uvBuffer);
    gl.vertexAttribPointer(programInfo.uvAttribLoc, 2, gl.FLOAT, false, 0, sprite << 5);
    gl.vertexAttrib4fv(programInfo.tintAttribLoc, tint);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

function resize(gl: WebGLRenderingContext, pi: ProgramInfo, rotation: { x: number, y: number },) {
    const canvasWidth = gl.canvas.clientWidth;
    const canvasHeight = gl.canvas.clientHeight;
    gl.canvas.width = canvasWidth;
    gl.canvas.height = canvasHeight;
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    const x = canvasWidth > canvasHeight ? canvasWidth / canvasHeight : 1.0;
    const y = canvasHeight > canvasWidth ? canvasHeight / canvasWidth : 1.0;

    const mv = mat4.identity(mat4Tmp1);
    mat4.rotateX(mv, mv, rotation.x);
    mat4.rotateY(mv, mv, rotation.y);
    gl.uniformMatrix4fv(pi.mvUniformLoc, false, mv);

    const mvp = mat4.identity(mat4Tmp2);
    mat4.ortho(
        mvp,
        -x,
        x,
        -y,
        y,
        -10,
        10,
    );
    mat4.mul(mvp, mvp, mv);
    gl.uniformMatrix4fv(pi.mvpUniformLoc, false, mvp);
}
