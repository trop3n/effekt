#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_amount;
uniform float u_size;
uniform float u_chroma;
uniform float u_shadow;
uniform float u_midtone;
uniform float u_highlight;
uniform float u_speed;
out vec4 fragColor;

// Hash function for pseudo-random grain
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec4 color = texture(u_input, v_uv);
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

  // Luminance zone weighting
  float shadowWeight = 1.0 - smoothstep(0.0, 0.33, luma);
  float highlightWeight = smoothstep(0.67, 1.0, luma);
  float midWeight = 1.0 - shadowWeight - highlightWeight;
  float zoneWeight = shadowWeight * u_shadow + midWeight * u_midtone + highlightWeight * u_highlight;

  // Animated grain
  float t = floor(u_time * max(u_speed, 0.001) * 30.0);
  vec2 grainUV = v_uv * u_resolution / max(u_size, 0.5);

  float grain = hash(grainUV + t) - 0.5;
  float grainR = grain;
  float grainG = hash(grainUV + t + 1.0) - 0.5;
  float grainB = hash(grainUV + t + 2.0) - 0.5;

  // Mix mono vs chroma grain
  vec3 noiseColor = mix(
    vec3(grain),
    vec3(grainR, grainG, grainB),
    u_chroma
  );

  color.rgb += noiseColor * u_amount * zoneWeight;
  fragColor = color;
}
