# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Effekt is a WebGL 2 image effects editor (recreating effect.app). Built with Bun, Vite, vanilla TypeScript, and GLSL shaders.

## Commands

```sh
bun run dev       # Vite dev server with HMR
bun run build     # Production build (~40KB JS)
bun run preview   # Preview production build
bun install       # Install dependencies
```

## Architecture

### Rendering Pipeline
- **Fullscreen triangle** via `gl_VertexID` (3 verts, no VBO) — see `src/gl/fullscreen-quad.ts`
- **Ping-pong RGBA16F FBOs** for effect chaining — prevents precision loss across passes
- `Pipeline.ts` iterates active `EffectNode`s, binds FBOs, sets uniforms, draws. Last pass renders to screen.
- Multi-pass effects self-describe via `getPasses()` returning `PassDescriptor[]` (e.g., gaussian blur = 2 passes: horizontal + vertical)
- Render-on-demand: `requestAnimationFrame` loop only runs when animated effects are active (noise with speed > 0)

### Effect System
- **`EffectDefinition`** (template): id, name, category, params, fragment shader source, `getPasses()`
- **`EffectNode`** (instance): wraps a definition with runtime values, `isOn` toggle, serialize/deserialize via `toState()`/`fromState()`
- **`EffectGraph`**: ordered list of nodes with add/remove/toggle/reorder. Fires `onChange()` callback for UI sync.
- **`registry.ts`**: all 11 effect definitions (noise, levels, gaussian blur, curves, vignette, dither, CRT, RGB shift, halftone, bloom, chromatic aberration)
- **Curves** is special: uses a 256×1 RGBA LUT texture built from Catmull-Rom spline interpolation in `CurveEditor.ts`, sampled in the shader

### Standard Shader Uniforms
All fragment shaders receive: `u_input` (sampler2D), `u_resolution` (vec2), `u_time` (float), `u_aspect` (float). Effect-specific uniforms come from `EffectNode.values`.

### UI Layer
- `Header.ts` — logo + load media button
- `Dock.ts` — add-effect buttons (one per definition)
- `LayersPanel.ts` — ordered effect list with drag-to-reorder, toggle visibility, remove
- `ControlsPanel.ts` — parameter sliders for selected effect (or CurveEditor for curves)
- `CanvasViewport.ts` — CSS-transform zoom/pan (wheel zoom, Alt+drag pan, keyboard shortcuts). Does not affect WebGL/export.
- `Toolbar.ts` — export format picker (PNG/JPEG) + resolution display

### State Management
- **History**: 50-entry circular buffer of `GraphSnapshot`s. Undo/redo via Ctrl+Z / Ctrl+Shift+Z.
- Slider drags capture pre-drag snapshot on `pointerdown`, push post-drag on `pointerup` — so each drag is one undo step.
- `EffectGraph.snapshot()`/`restore()` serializes/rebuilds the full node list.

### Image I/O
- **Input**: `MediaInput.ts` — file picker + drag-drop → `TextureLoader` uploads to WebGL texture
- **Export**: `ExportPNG.ts` — `readPixels` from FBO → flip vertically → `toBlob` → download link

## Key Conventions

- Use Bun for all tooling (install, run, test). Don't use npm/yarn/node.
- Vite + `vite-plugin-glsl` for dev/build. Shaders are `.vert`/`.frag` files imported as strings.
- Vanilla TypeScript — no React, no framework. UI is imperative DOM manipulation.
- All WebGL code targets WebGL 2 (`#version 300 es` shaders).
