#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform vec2 u_direction; // (1,0) for horizontal, (0,1) for vertical
uniform float u_strength;
out vec4 fragColor;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec2 dir = u_direction * texelSize * u_strength;

  // 9-tap Gaussian kernel (sigma ~2)
  vec4 sum = vec4(0.0);
  sum += texture(u_input, v_uv - 4.0 * dir) * 0.0162;
  sum += texture(u_input, v_uv - 3.0 * dir) * 0.0540;
  sum += texture(u_input, v_uv - 2.0 * dir) * 0.1218;
  sum += texture(u_input, v_uv - 1.0 * dir) * 0.1966;
  sum += texture(u_input, v_uv) * 0.2228;
  sum += texture(u_input, v_uv + 1.0 * dir) * 0.1966;
  sum += texture(u_input, v_uv + 2.0 * dir) * 0.1218;
  sum += texture(u_input, v_uv + 3.0 * dir) * 0.0540;
  sum += texture(u_input, v_uv + 4.0 * dir) * 0.0162;

  fragColor = sum;
}
