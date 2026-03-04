#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;
uniform float u_scanlineWidth;
uniform float u_curvature;
uniform float u_vignetteAmount;
out vec4 fragColor;

const float PI = 3.14159265;

void main() {
  // Barrel distortion
  vec2 uv = v_uv * 2.0 - 1.0; // [-1, 1]
  float d = dot(uv, uv);
  uv *= 1.0 + u_curvature * d;
  uv = uv * 0.5 + 0.5; // back to [0, 1]

  // Out of bounds → black
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec4 color = texture(u_input, uv);

  // Scanlines
  float scanline = sin(uv.y * u_resolution.y * PI / u_scanlineWidth);
  scanline = scanline * scanline; // square for sharper lines
  color.rgb *= 1.0 - u_scanlineIntensity * (1.0 - scanline);

  // Phosphor RGB sub-pixel tinting
  float px = mod(floor(uv.x * u_resolution.x), 3.0);
  vec3 phosphor = vec3(
    px < 1.0 ? 1.0 : 0.6,
    (px >= 1.0 && px < 2.0) ? 1.0 : 0.6,
    px >= 2.0 ? 1.0 : 0.6
  );
  color.rgb *= mix(vec3(1.0), phosphor, u_scanlineIntensity * 0.5);

  // CRT edge vignette
  vec2 vig = uv * (1.0 - uv);
  float vigFactor = pow(vig.x * vig.y * 16.0, u_vignetteAmount * 0.3);
  color.rgb *= clamp(vigFactor, 0.0, 1.0);

  fragColor = color;
}
