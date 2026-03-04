/** Empty VAO for fullscreen triangle rendering via gl_VertexID */
let vao: WebGLVertexArrayObject | null = null;

export function drawFullscreenTriangle(gl: WebGL2RenderingContext) {
  if (!vao) {
    vao = gl.createVertexArray();
  }
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}
