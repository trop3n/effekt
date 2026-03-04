import type { EffectDefinition } from '../types.ts';
import vignetteFrag from '../shaders/vignette.frag';
import levelsFrag from '../shaders/levels.frag';
import noiseFrag from '../shaders/noise.frag';
import gaussianBlurFrag from '../shaders/gaussian-blur.frag';
import curvesFrag from '../shaders/curves.frag';
import ditherFrag from '../shaders/dither.frag';
import crtFrag from '../shaders/crt.frag';
import rgbShiftFrag from '../shaders/rgb-shift.frag';
import halftoneFrag from '../shaders/halftone.frag';
import bloomFrag from '../shaders/bloom.frag';
import chromaticAberrationFrag from '../shaders/chromatic-aberration.frag';

export const effectDefinitions: EffectDefinition[] = [
  {
    id: 'noise',
    name: 'Noise',
    category: 'Generate',
    fragSource: noiseFrag,
    params: [
      { name: 'u_amount', label: 'Amount', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'u_size', label: 'Size', type: 'slider', min: 0.5, max: 8, step: 0.1, default: 1.5 },
      { name: 'u_chroma', label: 'Chroma', type: 'slider', min: 0, max: 1, step: 0.01, default: 0 },
      { name: 'u_shadow', label: 'Shadow', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'u_midtone', label: 'Mid-tone', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'u_highlight', label: 'Highlight', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
      { name: 'u_speed', label: 'Speed', type: 'slider', min: 0, max: 2, step: 0.01, default: 0 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'levels',
    name: 'Levels',
    category: 'Color',
    fragSource: levelsFrag,
    params: [
      { name: 'u_inputBlack', label: 'Input Black', type: 'slider', min: 0, max: 1, step: 0.01, default: 0 },
      { name: 'u_inputWhite', label: 'Input White', type: 'slider', min: 0, max: 1, step: 0.01, default: 1 },
      { name: 'u_midpoint', label: 'Midpoint', type: 'slider', min: 0.01, max: 4, step: 0.01, default: 1 },
      { name: 'u_outputBlack', label: 'Output Black', type: 'slider', min: 0, max: 1, step: 0.01, default: 0 },
      { name: 'u_outputWhite', label: 'Output White', type: 'slider', min: 0, max: 1, step: 0.01, default: 1 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'gaussian-blur',
    name: 'Gaussian Blur',
    category: 'Blur',
    fragSource: gaussianBlurFrag,
    params: [
      { name: 'u_strength', label: 'Strength', type: 'slider', min: 0, max: 20, step: 0.1, default: 5 },
    ],
    getPasses: () => [
      { uniforms: { u_direction: [1, 0] } },
      { uniforms: { u_direction: [0, 1] } },
    ],
  },
  {
    id: 'curves',
    name: 'Curves',
    category: 'Color',
    fragSource: curvesFrag,
    params: [], // Curve params are handled by the CurveEditor UI
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'vignette',
    name: 'Vignette',
    category: 'Effects',
    fragSource: vignetteFrag,
    params: [
      { name: 'u_size', label: 'Size', type: 'slider', min: 0, max: 2, step: 0.01, default: 0.8 },
      { name: 'u_softness', label: 'Softness', type: 'slider', min: 0, max: 1.5, step: 0.01, default: 0.5 },
      { name: 'u_roundness', label: 'Roundness', type: 'slider', min: 0, max: 1, step: 0.01, default: 1 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'dither',
    name: 'Dither',
    category: 'Color',
    fragSource: ditherFrag,
    params: [
      { name: 'u_colors', label: 'Colors', type: 'slider', min: 2, max: 16, step: 1, default: 4 },
      { name: 'u_pixelSize', label: 'Pixel Size', type: 'slider', min: 1, max: 16, step: 1, default: 2 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'crt',
    name: 'CRT Screen',
    category: 'Effects',
    fragSource: crtFrag,
    params: [
      { name: 'u_scanlineIntensity', label: 'Scanline Intensity', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.4 },
      { name: 'u_scanlineWidth', label: 'Scanline Width', type: 'slider', min: 1, max: 8, step: 0.1, default: 2 },
      { name: 'u_curvature', label: 'Curvature', type: 'slider', min: 0, max: 0.5, step: 0.01, default: 0.1 },
      { name: 'u_vignetteAmount', label: 'Vignette', type: 'slider', min: 0, max: 2, step: 0.01, default: 0.5 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'rgb-shift',
    name: 'RGB Shift',
    category: 'Effects',
    fragSource: rgbShiftFrag,
    params: [
      { name: 'u_amount', label: 'Amount', type: 'slider', min: 0, max: 20, step: 0.1, default: 5 },
      { name: 'u_angle', label: 'Angle', type: 'slider', min: 0, max: 6.28, step: 0.01, default: 0 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'halftone',
    name: 'Halftone',
    category: 'Effects',
    fragSource: halftoneFrag,
    params: [
      { name: 'u_dotSize', label: 'Dot Size', type: 'slider', min: 4, max: 32, step: 1, default: 8 },
      { name: 'u_angle', label: 'Angle', type: 'slider', min: 0, max: 180, step: 1, default: 45 },
      { name: 'u_softness', label: 'Softness', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'Effects',
    fragSource: bloomFrag,
    params: [
      { name: 'u_threshold', label: 'Threshold', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.6 },
      { name: 'u_intensity', label: 'Intensity', type: 'slider', min: 0, max: 2, step: 0.01, default: 0.5 },
      { name: 'u_radius', label: 'Radius', type: 'slider', min: 1, max: 20, step: 0.1, default: 5 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
  {
    id: 'chromatic-aberration',
    name: 'Chromatic Aberration',
    category: 'Effects',
    fragSource: chromaticAberrationFrag,
    params: [
      { name: 'u_amount', label: 'Amount', type: 'slider', min: 0, max: 30, step: 0.1, default: 5 },
      { name: 'u_falloff', label: 'Falloff', type: 'slider', min: 0.5, max: 3, step: 0.01, default: 1.5 },
    ],
    getPasses: () => [{ uniforms: {} }],
  },
];

export const effectRegistry = new Map<string, EffectDefinition>(
  effectDefinitions.map(d => [d.id, d]),
);
