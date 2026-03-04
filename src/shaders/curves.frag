#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform sampler2D u_lut; // 256x1 RGBA LUT texture
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);

  // Sample the LUT for each channel
  // The LUT texture encodes: R channel maps R, G channel maps G, B channel maps B, A maps master
  float r = texture(u_lut, vec2(color.r, 0.5)).r;
  float g = texture(u_lut, vec2(color.g, 0.5)).g;
  float b = texture(u_lut, vec2(color.b, 0.5)).b;

  fragColor = vec4(r, g, b, color.a);
}
