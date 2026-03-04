#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_angle;
out vec4 fragColor;

void main() {
  vec2 dir = vec2(cos(u_angle), sin(u_angle)) * u_amount / u_resolution;

  float r = texture(u_input, v_uv + dir).r;
  float g = texture(u_input, v_uv).g;
  float b = texture(u_input, v_uv - dir).b;
  float a = texture(u_input, v_uv).a;

  fragColor = vec4(r, g, b, a);
}
