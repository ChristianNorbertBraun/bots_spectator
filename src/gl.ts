var D = document;
var FA = Float32Array;

function getContext(): WebGLRenderingContext {
    var c = D.getElementById('Canvas') as HTMLCanvasElement;
    return c.getContext('webgl') || c.getContext('experimental-webgl')!!;
}

function compileShader(gl: WebGLRenderingContext, type: GLenum, src: string) {
    var shader = gl.createShader(type)!!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader
}

function initBuffers(gl: WebGLRenderingContext, program: WebGLProgram) {
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new FA([
            -1, 1,
            -1, -1,
            1, 1,
            1, -1]),
        gl.STATIC_DRAW);
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new FA(calcUvCoords()), gl.STATIC_DRAW)
    // var vertexBufferLoc = getEnabledAttribLocation(program, 'p')
    // var uvBufferLoc = getEnabledAttribLocation(program, 'uv')

    // var perspectiveLoc = gl.getUniformLocation(program, 'perspective');
    // var transformationLoc = gl.getUniformLocation(program, 'transformation');
    // var textureLoc = gl.getUniformLocation(program, 'texture');
}

export function init() {
    var gl = getContext();
    //  var texture = createTextureFrom(atlas)
    var program = gl.createProgram()!!;
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER,
        D.getElementById('VertexShader')!!.textContent!!));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER,
        D.getElementById('FragmentShader')!!.textContent!!));
    gl.linkProgram(program);
    gl.useProgram(program);
    initBuffers(gl, program);
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
}
