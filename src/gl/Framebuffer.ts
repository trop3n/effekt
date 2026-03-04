export class PingPongBuffers {
  private gl: WebGL2RenderingContext;
  private fbos: [WebGLFramebuffer, WebGLFramebuffer];
  private textures: [WebGLTexture, WebGLTexture];
  private current = 0;
  width = 0;
  height = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.fbos = [gl.createFramebuffer()!, gl.createFramebuffer()!];
    this.textures = [gl.createTexture()!, gl.createTexture()!];
  }

  resize(width: number, height: number) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    const gl = this.gl;

    for (let i = 0; i < 2; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i]!);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA16F,
        width, height, 0,
        gl.RGBA, gl.FLOAT, null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[i]!);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, this.textures[i]!, 0,
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.current = 0;
  }

  /** Bind the write FBO for rendering into */
  bindForWriting() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[this.current]!);
    gl.viewport(0, 0, this.width, this.height);
  }

  /** Get the texture from the current write target (to read after rendering) */
  get writeTexture(): WebGLTexture {
    return this.textures[this.current]!;
  }

  /** Get the texture from the previous render (the read source) */
  get readTexture(): WebGLTexture {
    return this.textures[1 - this.current]!;
  }

  /** Swap read/write targets */
  swap() {
    this.current = 1 - this.current;
  }

  /** Get the texture that was last written to (before swap) */
  get lastWrittenTexture(): WebGLTexture {
    // After swap, the "read" texture is the one that was last written
    return this.textures[1 - this.current]!;
  }
}
