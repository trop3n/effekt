#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_falloff;
out vec4 fragColor;

void main() {
  vec2 center = v_uv - 0.5;
  float dist = length(center);

  // Radial offset: increases toward edges
  float strength = pow(dist, u_falloff) * u_amount / u_resolution.x;
  vec2 dir = normalize(center + 1e-6); // avoid div by zero at center

  // R shifted outward, B shifted inward
  float r = texture(u_input, v_uv + dir * strength).r;
  float g = texture(u_input, v_uv).g;
  float b = texture(u_input, v_uv - dir * strength).b;
  float a = texture(u_input, v_uv).a;

  fragColor = vec4(r, g, b, a);
}
