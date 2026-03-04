#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_colors;
uniform float u_pixelSize;
out vec4 fragColor;

// 8x8 Bayer matrix via bit manipulation
float bayer8(vec2 p) {
  ivec2 ip = ivec2(p) & 7;
  int x = ip.x;
  int y = ip.y;
  // Compute Bayer index
  int v = 0;
  v |= ((x ^ y) & 1) << 2;
  v |= ((x & 1) ^ ((y >> 1) & 1)) << 1;
  v |= (((x >> 1) & 1) ^ ((y >> 2) & 1));
  v |= ((x >> 2) & 1) << 5;
  v |= ((y >> 1) & 1) << 4;
  v |= ((y >> 2) & 1) << 3;
  return float(v) / 64.0;
}

void main() {
  // Pixelation: snap UV to grid
  float px = max(u_pixelSize, 1.0);
  vec2 pixelUV = floor(v_uv * u_resolution / px) * px / u_resolution;
  vec4 color = texture(u_input, pixelUV);

  // Quantize with dither offset
  float levels = max(u_colors, 2.0);
  float steps = levels - 1.0;
  vec2 screenPos = v_uv * u_resolution / px;
  float threshold = bayer8(screenPos) - 0.5;

  color.rgb = floor(color.rgb * steps + 0.5 + threshold) / steps;
  color.rgb = clamp(color.rgb, 0.0, 1.0);

  fragColor = color;
}
