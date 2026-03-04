#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_size;
uniform float u_softness;
uniform float u_roundness;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  vec2 center = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  center.x *= aspect;

  float dist = length(center);
  float vig = smoothstep(u_size, u_size - u_softness, dist);
  color.rgb *= vig;
  fragColor = color;
}
