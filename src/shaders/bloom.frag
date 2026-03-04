#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
out vec4 fragColor;

vec3 sampleBright(vec2 uv) {
  vec3 c = texture(u_input, uv).rgb;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float bright = smoothstep(u_threshold, u_threshold + 0.2, luma);
  return c * bright;
}

void main() {
  vec4 original = texture(u_input, v_uv);
  vec2 texel = u_radius / u_resolution;

  // 13-tap cross blur (horizontal + vertical Gaussian)
  vec3 bloom = vec3(0.0);
  // Gaussian weights: [0.227, 0.194, 0.121, 0.054, 0.016, 0.003]
  float weights[6] = float[](0.227027, 0.194594, 0.121622, 0.054054, 0.016216, 0.003216);

  // Center sample
  bloom += sampleBright(v_uv) * weights[0];

  // Horizontal taps
  for (int i = 1; i < 6; i++) {
    float offset = float(i);
    bloom += sampleBright(v_uv + vec2(texel.x * offset, 0.0)) * weights[i];
    bloom += sampleBright(v_uv - vec2(texel.x * offset, 0.0)) * weights[i];
  }

  // Vertical taps
  for (int i = 1; i < 6; i++) {
    float offset = float(i);
    bloom += sampleBright(v_uv + vec2(0.0, texel.y * offset)) * weights[i];
    bloom += sampleBright(v_uv - vec2(0.0, texel.y * offset)) * weights[i];
  }

  // Normalize (we sampled 2 directions separately, center counted once)
  bloom *= 0.5;

  // Additive composite
  fragColor = vec4(original.rgb + bloom * u_intensity, original.a);
}
