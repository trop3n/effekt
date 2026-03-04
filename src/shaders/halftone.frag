#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_dotSize;
uniform float u_angle;
uniform float u_softness;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

  // Rotate UV by angle
  float rad = u_angle * 3.14159265 / 180.0;
  float cosA = cos(rad);
  float sinA = sin(rad);
  vec2 px = v_uv * u_resolution;
  vec2 rotated = vec2(
    px.x * cosA - px.y * sinA,
    px.x * sinA + px.y * cosA
  );

  // Tile into dot grid
  vec2 cell = mod(rotated, u_dotSize) - u_dotSize * 0.5;
  float dist = length(cell);

  // Dot radius proportional to darkness
  float radius = (1.0 - luma) * u_dotSize * 0.5;
  float softEdge = u_softness * u_dotSize * 0.1;
  float dot = 1.0 - smoothstep(radius - softEdge, radius + softEdge, dist);

  fragColor = vec4(vec3(dot), color.a);
}
