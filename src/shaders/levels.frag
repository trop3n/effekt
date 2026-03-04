#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform float u_inputBlack;
uniform float u_inputWhite;
uniform float u_midpoint;
uniform float u_outputBlack;
uniform float u_outputWhite;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);

  // Input range mapping
  vec3 c = clamp((color.rgb - u_inputBlack) / max(u_inputWhite - u_inputBlack, 0.001), 0.0, 1.0);

  // Gamma / midpoint adjustment
  c = pow(c, vec3(1.0 / max(u_midpoint, 0.01)));

  // Output range mapping
  c = mix(vec3(u_outputBlack), vec3(u_outputWhite), c);

  fragColor = vec4(c, color.a);
}
