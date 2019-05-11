const vertexShaderSource = `
attribute vec2 p;
attribute vec2 uv;
uniform mat3 perspective;
uniform mat3 transformation;
varying vec2 vuv;

void main() {
  gl_Position = vec4(perspective * transformation * vec3(p, 1.), 1.);
  vuv = uv;
}
`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vuv;
uniform sampler2D texture;

void main() {
  gl_FragColor = texture2D(texture, vuv.st).rgba;
}
`;

interface ProgramInfo {
    program: WebGLProgram,
    vertexBuffer: WebGLBuffer,
    uvBuffer: WebGLBuffer,
    vertexBufferLoc: number,
    uvBufferLoc: number,
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
    const vertexBufferLoc = getEnabledAttribLocation(gl, program, 'p');
    const uvBufferLoc = getEnabledAttribLocation(gl, program, 'uv');

    const perspectiveLoc = gl.getUniformLocation(program, 'perspective')!!;
    const transformationLoc = gl.getUniformLocation(program, 'transformation')!!;
    const textureLoc = gl.getUniformLocation(program, 'texture')!!;
    return {
        program,
        vertexBuffer,
        uvBuffer,
        vertexBufferLoc,
        uvBufferLoc,
        perspectiveLoc,
        transformationLoc,
        textureLoc,
    };
}

export interface MyGL {
    texture: WebGLTexture,
    programInfo: ProgramInfo,
    initFrame: () => void,
    drawSprite: (spriteId: number, x: number, y: number) => void,
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
    gl.clearColor(.898, .800, .505, 1);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // wireInputs()
    // createDust()
    // createBlood()
    // createMap()
    // createEntities()
    // W.onresize = resize
    // resize()
    // run()
    // return Promise.resolve();
    return {
        texture,
        programInfo,
        initFrame: () => initFrame(gl, programInfo, texture),
        drawSprite: (spriteId: number, x: number, y: number) => {
            drawSprite(gl, spriteId, x, y, 1, 1, programInfo);
        }
    };
}

function initFrame(gl: WebGLRenderingContext, pi: ProgramInfo, texture: WebGLTexture) {
    resize(gl, pi);
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
    a.src = 'atlas.gif';
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
    for (var y = 0, h = atlas.height; y < h; y += tileSize) {
        for (var x = 0, w = atlas.width; x < w; x += tileSize) {
            var l = x * xf,
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

function getEnabledAttribLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    return loc;
}

function drawSprite(gl: WebGLRenderingContext, sprite: number, x: number, y: number, xm: number, ym: number, pi: ProgramInfo) {
    const spriteRad = .03;
    const transformation = new Float32Array([
        spriteRad * (xm || 1), 0, 0,
        0, spriteRad * (ym || 1), 0,
        x * spriteRad, y * spriteRad, 1
    ]);
    gl.vertexAttribPointer(pi.uvBufferLoc, 2, gl.FLOAT, false, 0, sprite << 5);
    gl.uniformMatrix3fv(pi.transformationLoc, false, transformation);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function resize(gl: WebGLRenderingContext, pi: ProgramInfo) {
    const width = gl.canvas.clientWidth,
        height = gl.canvas.clientHeight;
    // const halfWidth = width >> 1;
    // const halfHeight = height >> 1;
//    const yMax = height / width;
    gl.canvas.width = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, width, height);
//    const spriteRad = Math.min(1, yMax) * .1;
    // cellSize = spriteRad * 2;
    // npcSpeed = spriteRad * .2;
    // spaceWidth = spriteRad * .65;
    // messageY = yMax - spriteRad;
    // maxColsInView = (2 / cellSize | 0) + 2;
    // maxRowsInView = ((yMax + yMax) / cellSize | 0) + 2;
    // var halfCellSize = cellSize * .5;
    // viewXMin = -1 + halfCellSize;
    // viewXMax = 1 - (mapCols * cellSize) + halfCellSize;
    // viewYMin = yMax - halfCellSize;
    // viewYMax = (mapRows * cellSize) - yMax - halfCellSize;
    const perspective = new Float32Array([
        1, 0, 0,
        0, width / height, 0,
        0, 0, 1
    ]);
    gl.uniformMatrix3fv(pi.perspectiveLoc, false, perspective);
}
