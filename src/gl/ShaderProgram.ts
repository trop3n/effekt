export class ShaderProgram {
  readonly program: WebGLProgram;
  private uniformCache = new Map<string, WebGLUniformLocation | null>();
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string) {
    this.gl = gl;
    const vs = this.compile(gl.VERTEX_SHADER, vertSrc);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragSrc);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader link error: ${log}`);
    }

    // Shaders are linked, no longer needed individually
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  uniform(name: string): WebGLUniformLocation | null {
    if (this.uniformCache.has(name)) return this.uniformCache.get(name)!;
    const loc = this.gl.getUniformLocation(this.program, name);
    this.uniformCache.set(name, loc);
    return loc;
  }

  set1i(name: string, value: number) {
    const loc = this.uniform(name);
    if (loc !== null) this.gl.uniform1i(loc, value);
  }

  set1f(name: string, value: number) {
    const loc = this.uniform(name);
    if (loc !== null) this.gl.uniform1f(loc, value);
  }

  set2f(name: string, x: number, y: number) {
    const loc = this.uniform(name);
    if (loc !== null) this.gl.uniform2f(loc, x, y);
  }

  set3f(name: string, x: number, y: number, z: number) {
    const loc = this.uniform(name);
    if (loc !== null) this.gl.uniform3f(loc, x, y, z);
  }

  set4f(name: string, x: number, y: number, z: number, w: number) {
    const loc = this.uniform(name);
    if (loc !== null) this.gl.uniform4f(loc, x, y, z, w);
  }

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      const kind = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      throw new Error(`${kind} shader compile error:\n${log}`);
    }

    return shader;
  }
}
