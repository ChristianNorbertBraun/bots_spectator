import {mat4} from "gl-matrix";
import {paletteColor5} from "./palette";
import chroma from "chroma-js";
import {Rect} from "./geom";

const vertexShaderSource = `
attribute vec2 p;
attribute vec2 uv;
attribute vec4 tint;
uniform mat4 perspective;
uniform mat4 transformation;
varying vec2 vuv;
varying vec4 vtint;

void main() {
  gl_Position = perspective * transformation * vec4(p, 1., 1.);
  vuv = uv;
  vtint = tint;
}
`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vuv;
varying vec4 vtint;
uniform sampler2D texture;

void main() {
  gl_FragColor = texture2D(texture, vuv.st).rgba;
  gl_FragColor.rgb *= vtint.rgb;
  gl_FragColor *= vtint.a;
}
`;

const defaultTint = new Float32Array([1, 1, 1, 1]);

interface ProgramInfo {
    program: WebGLProgram,
    vertexBuffer: WebGLBuffer,
    uvBuffer: WebGLBuffer,
    vertexBufferLoc: number,
    uvBufferLoc: number,
    tintAttribLoc: number,
    perspectiveLoc: WebGLUniformLocation,
    transformationLoc: WebGLUniformLocation,
    textureLoc: WebGLUniformLocation,
}

function compileShader(gl: WebGLRenderingContext, type: GLenum, src: string) {
    const shader = gl.createShader(type)!!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader
}

function initBuffers(gl: WebGLRenderingContext, program: WebGLProgram, atlas: HTMLImageElement): ProgramInfo {
    const vertexBuffer = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
            0, 1,
            0, 0,
            1, 1,
            1, 0]),
        gl.STATIC_DRAW);
    const uvBuffer = gl.createBuffer()!!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(calcUvCoords(atlas)), gl.STATIC_DRAW);

    const vertexBufferLoc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(vertexBufferLoc);
    const uvBufferLoc = gl.getAttribLocation(program, 'uv');
    gl.enableVertexAttribArray(uvBufferLoc);
    const tintAttribLoc = gl.getAttribLocation(program, "tint");

    const perspectiveLoc = gl.getUniformLocation(program, 'perspective')!!;
    const transformationLoc = gl.getUniformLocation(program, 'transformation')!!;
    const textureLoc = gl.getUniformLocation(program, 'texture')!!;
    return {
        program,
        vertexBuffer,
        uvBuffer,
        vertexBufferLoc,
        uvBufferLoc,
        tintAttribLoc,
        perspectiveLoc,
        transformationLoc,
        textureLoc,
    };
}

export interface MyGL {
    texture: WebGLTexture,
    programInfo: ProgramInfo,
    initFrame: (worldRect: Rect) => void,
    drawSprite: (spriteId: number, x: number, y: number, tint?: Float32Array) => void,
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
        texture,
        programInfo,
        initFrame: (worldRect: Rect) => initFrame(gl, programInfo, texture, worldRect),
        drawSprite: (spriteId: number, x: number, y: number, tint: Float32Array = defaultTint) => {
            drawSprite(gl, spriteId, x, y, tint, programInfo);
        }
    };
}

function initFrame(gl: WebGLRenderingContext, pi: ProgramInfo, texture: WebGLTexture, worldRect: Rect) {
    resize(gl, pi, worldRect);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(pi.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, pi.vertexBuffer);
    gl.vertexAttribPointer(pi.vertexBufferLoc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(pi.textureLoc, 0);
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

function drawSprite(gl: WebGLRenderingContext, sprite: number, x: number, y: number, tint: Float32Array, pi: ProgramInfo) {
    const spriteRad = 1;
    const transformation = new Float32Array([
        spriteRad, 0, 0, 0,
        0, spriteRad, 0, 0,
        x * spriteRad, y * spriteRad, 1, 0,
        0, 0, 0, 1,
    ]);
    gl.vertexAttrib4fv(pi.tintAttribLoc, tint)
    gl.vertexAttribPointer(pi.uvBufferLoc, 2, gl.FLOAT, false, 0, sprite << 5);
    gl.uniformMatrix4fv(pi.transformationLoc, false, transformation);
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

    const perspective = mat4.create();
    mat4.ortho(
        perspective,
        offX + worldRect.x,
        offX + worldRect.x + scale * canvasWidth,
        offY + worldRect.y,
        offY + worldRect.y + scale * canvasHeight,
        -10,
        10,
    );

    gl.uniformMatrix4fv(pi.perspectiveLoc, false, perspective);
}
