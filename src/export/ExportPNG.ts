export type ExportFormat = 'png' | 'jpeg';

export function exportImage(
  gl: WebGL2RenderingContext,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number,
  format: ExportFormat = 'png',
  quality: number = 0.92,
) {
  // Read pixels from the current framebuffer (screen or FBO)
  const pixels = new Uint8Array(width * height * 4);

  if (fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  }
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  if (fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Flip vertically (WebGL reads bottom-up)
  const rowSize = width * 4;
  const flipped = new Uint8Array(pixels.length);
  for (let y = 0; y < height; y++) {
    const srcRow = y * rowSize;
    const dstRow = (height - 1 - y) * rowSize;
    flipped.set(pixels.subarray(srcRow, srcRow + rowSize), dstRow);
  }

  // Draw to a 2D canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
  ctx.putImageData(imageData, 0, 0);

  // Export via toBlob for memory efficiency
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `effekt-export.${ext}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, mimeType, format === 'jpeg' ? quality : undefined);
}

/** Read pixels from the default framebuffer (canvas) */
export function exportFromCanvas(
  gl: WebGL2RenderingContext,
  format: ExportFormat = 'png',
  quality: number = 0.92,
) {
  exportImage(gl, null, gl.drawingBufferWidth, gl.drawingBufferHeight, format, quality);
}
