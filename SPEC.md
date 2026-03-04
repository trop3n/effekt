# Effect.app — Faithful Recreation Specification

> A comprehensive technical specification for recreating [effect.app](https://effect.app) as a personal learning project.
> Researched via Playwright, network inspection, public API analysis, and source code examination.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack Analysis](#2-tech-stack-analysis)
3. [Recommended Implementation Stack](#3-recommended-implementation-stack)
4. [Application Architecture](#4-application-architecture)
5. [Design System](#5-design-system)
6. [Page & Route Structure](#6-page--route-structure)
7. [Editor UI — Component Inventory](#7-editor-ui--component-inventory)
8. [Effect System Architecture](#8-effect-system-architecture)
9. [Effect Catalog (51 Effects)](#9-effect-catalog-51-effects)
10. [Preset System](#10-preset-system)
11. [Layer System](#11-layer-system)
12. [Export System](#12-export-system)
13. [Authentication System](#13-authentication-system)
14. [Backend API Specification](#14-backend-api-specification)
15. [Data Models](#15-data-models)
16. [Subscription / Tier System](#16-subscription--tier-system)
17. [Landing Page](#17-landing-page)
18. [Keyboard Shortcuts](#18-keyboard-shortcuts)
19. [Figma Plugin & Chrome Extension](#19-figma-plugin--chrome-extension)
20. [Implementation Roadmap](#20-implementation-roadmap)

---

## 1. Application Overview

**Effect.app** is a browser-based, real-time image and video effects editor powered by WebGL 2. It applies a linear pipeline of GLSL fragment shader effects to an uploaded image or video frame-by-frame.

### Core Value Propositions
- **Real-time**: All effects update live as sliders move — no "apply" button
- **Privacy-first**: Everything runs locally in the browser; no files leave the machine
- **No installation**: Runs entirely in a modern browser
- **51+ professional effects** across Blur, Color, Distort, Effects, Generate, and Custom categories
- **Stacking**: Multiple effects chained in sequence (a "graph")
- **Video support**: Export animations and video clips
- **Presets**: Save/share named stacks as JSON snapshots

---

## 2. Tech Stack Analysis

Determined via network inspection, JS bundle analysis, and DOM examination.

### Frontend
| Concern | Technology |
|---------|-----------|
| Build tool | **Vite** (confirmed by hashed asset filenames like `index-RrcOaYDp.js`, `modulepreload-polyfill`) |
| Framework | **Vanilla JavaScript** (no React/Vue/Svelte — pure DOM manipulation with helper classes) |
| Rendering | **WebGL 2** (`canvas.getContext('webgl2')`) |
| Shader system | Custom `ShaderNodeGroup`/`Kt` (shader program wrapper) class |
| Styling | **Custom CSS** with CSS Custom Properties (design tokens), no CSS framework |
| Color space | **OKLCH** (modern perceptual color space for design tokens) |
| Fonts | `CommitMono` (monospace), `Baikal` (display), `MNOctic` — all custom WOFF2 |
| Analytics | Google Tag Manager (GTM-52KNGTRX) |

### Backend / Infra
| Concern | Technology |
|---------|-----------|
| API | REST at `/api/` |
| Auth | Email+password, Google OAuth, magic code (6-digit) |
| CDN | `cdn.effect.app` for user assets, preset covers |
| Payments | **Lemon Squeezy** |
| Effect shaders | Served as GLSL files at `/effects/{Category}/{name}.glsl` (encrypted in prod) |
| Effect catalog | `/effects.json` (JSON, public) |

---

## 3. Recommended Implementation Stack

For a faithful personal recreation:

### Frontend
```
Vite + TypeScript (vanilla, no framework)
WebGL 2 (native browser API)
Custom CSS with CSS custom properties
```

### Backend
```
Node.js + Fastify (or Bun + Hono)
PostgreSQL (user accounts, presets)
Redis (sessions)
S3-compatible object storage (preset covers, uploads if desired)
```

### Alternative (simpler, fully local)
```
Vite + TypeScript (no backend)
localStorage for presets (no auth)
IndexedDB for larger state
```

---

## 4. Application Architecture

### Core Render Loop

```
User uploads media (image or video)
          ↓
  MediaSource (HTMLImageElement | HTMLVideoElement)
          ↓
  Upload as WebGL2 texture (TEXTURE_2D)
          ↓
  Effect Graph (ordered array of ShaderNode)
    ┌─────────────────────────────────────────┐
    │  Node 0: Noise shader                   │
    │    uniforms: strength, size, chroma…    │
    ├─────────────────────────────────────────┤
    │  Node 1: Levels shader                  │
    │    uniforms: input_levels, midpoint…    │
    ├─────────────────────────────────────────┤
    │  Node N: …                              │
    └─────────────────────────────────────────┘
          ↓
  Ping-pong framebuffers (FBO A → FBO B → …)
          ↓
  Final composite → canvas display
          ↓
  Export: readPixels → PNG / video encode
```

### Ping-Pong Framebuffer Pattern
Each effect reads from the previous FBO texture and writes to the next. Two `WebGLFramebuffer` objects alternate. The final pass renders to the screen canvas.

```
Texture (source image)
  → FBO[0] with shader[0]
  → FBO[1] with shader[1]
  → FBO[0] with shader[2]
  → …
  → screen canvas
```

### Module Structure (mirroring actual bundles)
```
src/
├── index.html           # App shell (body.app)
├── main.ts              # Entry: init all modules
├── gl/
│   ├── WebGLContext.ts  # Canvas + WebGL2 context init (= It class)
│   ├── ShaderProgram.ts # Compile/link GLSL (= Kt class)
│   ├── ShaderNodeGroup.ts  # Effect pipeline runner
│   ├── Framebuffer.ts   # FBO ping-pong
│   └── TextureLoader.ts
├── effects/
│   ├── catalog.ts       # Load effects.json + per-effect GLSL
│   ├── EffectGraph.ts   # Ordered list of active effects
│   ├── EffectNode.ts    # {id, isOn, values, meta, shader}
│   └── controls/        # UI control renderers per param type
│       ├── Slider.ts
│       ├── Toggle.ts
│       ├── ColorPicker.ts
│       ├── CurveEditor.ts
│       └── GradientPicker.ts
├── media/
│   ├── MediaInput.ts    # File picker, URL loader, Unsplash
│   └── VideoPlayer.ts   # Playback + seek for video source
├── ui/
│   ├── Header.ts        # Top bar
│   ├── Dock.ts          # Bottom effect strip
│   ├── Selector.ts      # Effect/preset browser panel
│   ├── AsideLayers.ts   # Left panel: layers
│   ├── AsideControls.ts # Right panel: parameters
│   ├── Toolbar.ts       # Bottom overlay: zoom/export
│   ├── UserMenu.ts      # Dropdown user menu
│   ├── ExportMenu.ts    # Export format/resolution picker
│   └── Tooltip.ts
├── presets/
│   ├── PresetManager.ts
│   └── PresetModal.ts
├── auth/
│   ├── AuthModal.ts     # Sign up / Log in / Code modals
│   └── AuthAPI.ts
├── api/
│   └── client.ts        # Fetch wrapper for /api/
└── styles/
    ├── tokens.css       # CSS custom properties
    ├── base.css
    ├── components/
    └── layout/
```

---

## 5. Design System

### Color Tokens (exact values from source)

```css
:root {
  /* Base palette — monochromatic dark theme */
  --color-gray-950: #111112;  /* Darkest background */
  --color-gray-900: oklch(from var(--color-gray-950) calc(l + .0266) c h);
  --color-gray-850: oklch(from var(--color-gray-950) calc(l + .057)  c h);
  --color-gray-800: oklch(from var(--color-gray-950) calc(l + .0905) c h);
  --color-gray-750: oklch(from var(--color-gray-950) calc(l + .143)  c h);
  --color-gray-700: oklch(from var(--color-gray-950) calc(l + .1934) c h);
  --color-gray-600: oklch(from var(--color-gray-950) calc(l + .2605) c h);
  --color-gray-500: oklch(from var(--color-gray-950) calc(l + .3775) c h);
  --color-gray-400: oklch(from var(--color-gray-950) calc(l + .5374) c h);
  --color-gray-300: oklch(from var(--color-gray-950) calc(l + .6919) c h);
  --color-gray-200: oklch(from var(--color-gray-950) calc(l + .7438) c h);
  --color-gray-100: oklch(from var(--color-gray-950) calc(l + .7921) c h);

  /* Accent */
  --color-green-400: #4ade80;
  --color-green-600: #16a34a;
  --color-red-400:   #f87171;
  --color-red-600:   #dc2626;
  --color-red-700:   #b91c1c;
  --color-red-800:   #991b1b;
  --color-yellow-400: #facc15;
  --color-yellow-500: #eab308;
  --color-yellow-600: #ca8a04;

  /* Semantic surfaces */
  --bg-surface-1: var(--color-gray-950);  /* Main canvas bg */
  --bg-surface-2: var(--color-gray-900);  /* Panels */
  --bg-surface-3: var(--color-gray-800);  /* Controls, inputs */
  --bg-surface-4: var(--color-gray-700);  /* Hover states */

  /* Semantic text */
  --text-primary:   var(--color-gray-100);
  --text-secondary: var(--color-gray-300);
  --text-tertiary:  var(--color-gray-400);
  --text-warning:   var(--color-yellow-400);
  --text-error:     var(--color-red-400);

  /* Button variants */
  --btn-primary-bg:       var(--color-gray-100);  /* White button */
  --btn-primary-text:     var(--color-gray-950);
  --btn-neutral-bg:       var(--color-gray-800);
  --btn-neutral-text:     var(--color-gray-100);
  --btn-neutral-border:   var(--color-gray-600);
  --btn-subtle-bg:        transparent;
  --btn-subtle-text:      var(--color-gray-100);
  --btn-danger-primary-bg: var(--color-red-600);
}
```

**Key insight**: The entire palette derives from a single `#111112` base color using OKLCH relative color syntax — a very elegant approach. Only accent colors are hardcoded.

### Typography
| Font | Usage | Format |
|------|-------|--------|
| `CommitMono` | Code-like UI labels, effect names, controls | WOFF2 monospace |
| `Baikal` | Marketing/landing headings | WOFF2 display |
| `MNOctic` | Secondary display use | WOFF2 |

### Spacing / Layout
- Layout uses CSS Grid and Flexbox
- Base spacing unit: `4px` (inferred)
- Border radius: small (4-6px for controls, 8-12px for cards)
- The app has a rigid 3-panel layout: left aside → canvas → right aside

### Button Variants
Three main button styles:
1. **`button_variant_primary`** — white background, dark text (primary CTA)
2. **`button_variant_neutral`** — dark bg (`gray-800`), light text, visible border
3. **`button_variant_subtle`** — transparent bg, ghost style
4. **`button-icon`** — icon-only square button (sizes: `small`, `medium`, `large`)

---

## 6. Page & Route Structure

| Route | Description |
|-------|-------------|
| `/` | Main editor application (`body.app`) |
| `/?effect={id}` | Open editor with specific effect pre-loaded |
| `/?modal=upgrade` | Open editor with upgrade modal open |
| `/features` | Landing/marketing page (redirects from `/`) |
| `/explore` | Effect + preset gallery (browse without opening editor) |
| `/effects/{effect-id}` | Individual effect landing page |
| `/pricing` | Pricing page (embedded in landing) |
| `/changelog` | Release notes |
| `/blog` | Blog articles |
| `/faq` | FAQ page |
| `/figma-plugin` | Figma integration info |
| `/extension` | Chrome extension info |
| `/export-video` | Video export feature page |
| `/presets` | Presets feature page |
| `/ios-app` | iOS app info |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

**Note**: The landing page lives at `/features` — the root `/` redirects there if the user is not coming to use the app. The actual editor **also** runs at `/`, differentiated by JS logic (the `body.app` vs `body.landing-page` class).

---

## 7. Editor UI — Component Inventory

### Layout Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  app-header  [logo] [load media] [what's new] [sign in / user]    │  ~48px
├──────────────┬─────────────────────────────────┬───────────────────┤
│ aside-layers │                                 │ aside-controls    │
│  ┌─────────┐ │       canvas-container          │  ┌─────────────┐  │
│  │  Layers │ │         (WebGL canvas)          │  │ Effect name │  │
│  │  panel  │ │                                 │  │  controls   │  │
│  │  +media │ │                                 │  │  ─────────  │  │
│  │  upload │ │                                 │  │  params...  │  │
│  └─────────┘ │                                 │  │  ─────────  │  │
│              │     toolbar overlay (bottom)    │  │  preset     │  │
│              │  [video] [zoom] [format|EXPORT] │  │  panel      │  │
│   ~280px     │                                 │   ~300px       │  │
├──────────────┴─────────────────────────────────┴───────────────────┤
│  dock: [popular effects horizontal scroll strip]                   │  ~56px
└────────────────────────────────────────────────────────────────────┘
```

The **selector** slides in from the left over the aside-layers when clicking an effect in the dock.

### 7.1 App Header (`#app-header.app-header`)

```html
<header id="app-header" class="app-header">
  <div class="app-header__left">
    <a class="app-header__logo">
      <img class="app-header__logo-image" />
    </a>
  </div>
  <div class="app-header__center">
    <!-- Mobile only: undo/redo -->
    <button id="mobile-undo-button" class="app-header__history-button button-icon">
    <button id="mobile-redo-button" class="app-header__history-button button-icon">
  </div>
  <div class="app-header__right">
    <button class="app-header__load-media-button button">LOAD MEDIA</button>
    <button id="whats-new" class="button-icon">
      <span class="notification-bell-badge"></span>  <!-- red dot for new updates -->
    </button>
    <button class="app-header__auth-button button anon-only">SIGN IN</button>
    <div id="user-menu-group" class="app-header__user">
      <button id="user-button" class="user-only">
        <img id="user-avatar" />
      </button>
      <button id="help-button" class="button-icon anon-only">  <!-- ? icon -->
    </div>
  </div>
</header>
```

**Key patterns**:
- `anon-only` class: visible when not authenticated (CSS `.user-only { display: none }` when anon)
- `user-only` class: visible when authenticated
- `free-only` / `pro-only`: visibility toggled based on subscription tier

### 7.2 Aside — Layers Panel (`#aside-layers`)

Left panel, ~280px wide.

```
┌─────────────────────────────┐
│ LAYERS          [+]  [ADD]  │  header: title + "create preset" + "add layer" btn
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │  media-input area    │   │  Upload button + "from URL" + Unsplash random
│  │  [UPLOAD IMAGE/VIDEO]│   │
│  └──────────────────────┘   │
│  <img preview thumbnail>    │
├─────────────────────────────┤
│  Layers list (ol#layers):   │
│  ┌──handle── [name] [eye]┐  │  draggable layer item
│  │ ···  Layer 1     👁   │  │
│  └─────────────────────── ┘  │
│  ┌─────────────────────── ┐  │
│  │ ···  Layer 2     👁   │  │
│  └─────────────────────── ┘  │
├─────────────────────────────┤
│ [PRO banner - free users]   │  "Upgrade to Pro for more layers"
└─────────────────────────────┘
```

**Layer item structure**:
```html
<li class="layers__item layers__item_idle layers__item_active">
  <div class="layers__handle">
    <span class="layers__name">Layer name</span>
  </div>
  <div class="layers__trail">
    <div class="layers__icon"><!-- effect icon/preview --></div>
    <div class="layers__icon layers__icon_eye"><!-- visibility toggle --></div>
  </div>
</li>
```

**Media input buttons**:
- Upload from file (file picker)
- URL import (text input → fetch)
- Unsplash random image

### 7.3 Canvas Area (`#content.content`)

```html
<main id="content" class="content">
  <div id="canvas-container" class="canvas-container">
    <canvas></canvas>
  </div>
  <div class="copyright">  <!-- small credit watermark -->
  <div class="toolbar ui-overlay">
    <!-- Video controls (shown only when video loaded) -->
    <div id="videoControl" class="toolbar__group toolbar__group-video">
      <button id="videoPlayButton">  <!-- play/pause -->
      <input id="videoTimeLine" type="range" class="slider__range">  <!-- scrubber -->
      <div id="videoTime">  <!-- time display -->
      <button id="videoLoopButton">  <!-- loop toggle -->
      <div class="toolbar__divider">
    </div>

    <!-- Zoom control -->
    <div id="zoom-input" class="toolbar__zoom">
      <input id="zoom-level" type="number">
      <svg id="zoom-icon">
    </div>
    <div class="toolbar__divider">

    <!-- Export controls -->
    <div class="toolbar__export-group">
      <button id="export-menu-button" class="export-menu-button">
        <span id="export-format-display">PNG</span>
        <span id="export-details-display">2048 × 1536</span>
      </button>
      <button id="export-button" class="button_variant_primary">EXPORT</button>
    </div>

    <!-- Export format dropdown menu -->
    <div id="export-menu" class="export-menu menu export-menu--image-mode">
      <!-- Anim section (disabled on free for still images) -->
      <!-- Format section: PNG / JPEG / WebM / MP4 / GIF toggle group -->
      <!-- Quality/resolution section -->
    </div>
  </div>
</main>
```

**Zoom behavior**:
- Keyboard: `Ctrl +`, `Ctrl -`, `Ctrl 0` (100%), `Shift 1` (fit)
- Also: Zoom to 50%, 100%, 200% menu items
- Canvas panning: drag with mouse

### 7.4 Aside — Controls Panel (`#aside-controls`)

Right panel, ~300px wide. Has two sub-panels that swap:

**Effect controls panel** (shown when an effect is active):
```
┌─────────────────────────────────┐
│ NOISE              [🎲] [↺]    │  effect name + randomize + reset
├─────────────────────────────────┤
│ amount                          │
│ ├──────────────────┤  ←slider   │
│ size                            │
│ ├──────────────────┤            │
│ floor                           │
│ ├──────────────────┤            │
│ chroma                          │
│ ├──────────────────┤            │
│ shadow                          │
│ ├──────────────────┤            │
│ mid-tone                        │
│ ├──────────────────┤            │
│ highlight                       │
│ ├──────────────────┤            │
│ speed                           │
│ ├──────────────────┤            │
└─────────────────────────────────┘
```

**Preset panel** (shown when a preset is selected):
```
┌─────────────────────────────────┐
│ [preset name]                   │
├─────────────────────────────────┤
│  Preset group UI...             │
│  Collapsed / expanded groups    │
└─────────────────────────────────┘
```

**Parameter control types**:
- `param-control slider` — most common, range input + value display
- `param-control toggle` — boolean checkbox/switch
- `param-control color` — color picker
- `param-control select` / `switcher` — dropdown/radio for enum params
- `param-control curve` — curve editor (for Curves effect)
- `param-control gradient` — gradient editor (for Map to Gradient)
- `param-control number` — direct number input

### 7.5 Effect Selector Panel (`#selector`)

Slides in from the left (over the layers panel), ~360px wide. Contains tabbed browsing:

**Tabs** (`.switcher`):
1. **Effects** — categorized grid of all 51 effects with preview thumbnails
2. **Favorites** — user-starred effects (empty state if none)
3. **Presets** — public + user preset cards
4. **[Layers tab]** — possibly a fourth view

**Effects view**:
```
[search input]  [compact toggle]  [close]
─────────────────────────────────────────
MOST POPULAR
  [Noise] [Dither] [Levels] [CRT] [Ink Bleed]

NEW EFFECTS
  [Ink Bleed] [Texture Blur] [Curves] ...

BLUR
  [Depth of field] [Circular blur] [Gaussian blur] ...

COLOR
  [Thermal] [Curves] [Color balance] ...

DISTORT
  [Elastic grid] [Reeded glass] [Cubify] ...
...
```

Each effect card (`div.card`):
- Preview thumbnail (static JPG or animated)
- Effect name
- Click → add to current effect graph
- Hover → show preview on canvas (optional)
- `shiftKey` + click → replace current effect

### 7.6 Effect Dock (`div.dock`)

Horizontal scrollable strip of popular effects at the bottom of the viewport:

```
← [Noise] [Dither] [Levels] [CRT screen] [Ink bleed] [Texture Blur] ... →
```

- Items: `li.dock__item` containing icon + label
- Hover: visual scale/highlight with neighboring items also scaling (`dock__item--hover-next`, `dock__item--hover-next-next`)
- Click: apply effect (or open selector if shift+click)
- Scroll: horizontal scroll with mouse wheel or touch
- Arrows at ends: `at-start` / `at-end` CSS classes for fade indicators

### 7.7 User Menu (`#user-menu`)

Dropdown from user avatar:
- User info (email, plan badge: `pro` / `free`)
- "Upgrade to Pro" button (free users)
- Menu items: Presets, Features, Changelog, Support, Preferences
- Settings section: Media Preview (On/Off), Controls position (Left/Right)
- Links: Privacy, Terms, Instagram
- Sign out button

### 7.8 Modals

| Modal ID | Purpose |
|----------|---------|
| `#sign-up-modal` | Registration (email+password + Google OAuth) |
| `#log-in-modal` | Login (email+password + Google OAuth) |
| `#code-modal` | 6-digit email verification code |
| `#upgrade-modal` | Pricing/upgrade prompt |
| `#preset-edit-modal` | Create/edit preset (name + cover image) |
| `#pro-banner-modal` | Promotional pro offer (various variants) |
| `#confirm-modal` | Generic confirmation dialog |

---

## 8. Effect System Architecture

### 8.1 GLSL Shader Conventions

Effect shaders are **fragment shaders** that process a full-screen quad. Two vertex shader styles exist, based on auto-detection:

**ShaderToy-style** (has `mainImage` function):
```glsl
// Vertex shader auto-generated wrapper
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // effect code
}
```

**Standard style** (custom `main` function):
```glsl
precision highp float;
uniform sampler2D u_input;
uniform vec2 u_resolution;
// ... other uniforms
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec4 color = texture(u_input, uv);
    // ... processing
    fragColor = color;
}
```

**WebGL 2 style** (starts with `#version 300 es`):
```glsl
#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;
void main() { ... }
```

### 8.2 Standard Uniforms

Every shader receives these uniforms:
```glsl
uniform sampler2D u_input;      // Input texture from previous pass
uniform vec2 u_resolution;      // Canvas resolution in pixels
uniform float u_time;           // Animation time in seconds
uniform float u_aspect;         // Width / height
```

Video-specific:
```glsl
uniform float u_duration;       // Video duration
uniform float u_currentTime;    // Current playback time
```

### 8.3 Effect Node Data Model

```typescript
interface EffectNode {
  id: string;          // Effect identifier e.g. "noise", "gaussian-blur"
  isOn: boolean;       // Whether this node is active in the pipeline
  values: Record<string, EffectValue>;  // Parameter values
  meta?: Record<string, EffectMeta>;    // Complex param metadata (curves, gradients)
}

type EffectValue = number | number[] | string | boolean;

interface EffectMeta {
  curvePoints?: Array<{ id: string; x: number; y: number }>;
}
```

### 8.4 WebGL Render Loop

```typescript
class WebGLContext {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  // framebuffers: [WebGLFramebuffer, WebGLFramebuffer]
  // textures: [WebGLTexture, WebGLTexture]  (for ping-pong)

  constructor(canvas?: HTMLCanvasElement) {
    const opts = {
      premultipliedAlpha: true,
      alpha: true,
      preserveDrawingBuffer: false,  // Important: use false for performance
      antialias: false,
      depth: false,
      stencil: false
    };
    this.gl = canvas.getContext('webgl2', opts);

    // Enable extensions
    this.gl.getExtension('EXT_color_buffer_float');
    this.gl.getExtension('OES_texture_float_linear');
    this.gl.getExtension('KHR_parallel_shader_compile');
  }
}

class ShaderProgram {
  // Wraps compile + link
  // Caches uniform/attribute locations
  // Supports async compilation via KHR_parallel_shader_compile
}

// Main render function called on each animation frame
function render() {
  let inputTex = sourceTexture;

  for (let i = 0; i < effectNodes.length; i++) {
    const node = effectNodes[i];
    if (!node.isOn) continue;

    const fbo = framebuffers[i % 2];
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const program = shaders.get(node.id);
    gl.useProgram(program);

    // Set uniforms from node.values
    setUniforms(program, node.values, inputTex);

    drawFullscreenQuad();

    inputTex = fboTextures[i % 2];
  }

  // Final blit to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  blitToScreen(inputTex);

  requestAnimationFrame(render);
}
```

---

## 9. Effect Catalog (51 Effects)

Complete list from `/effects.json`, organized by category.

### 9.1 BLUR (7 effects)

| ID | Name | Key Parameters | Preview |
|----|------|---------------|---------|
| `depth-of-field` | Depth of Field | aperture shape, blade count, rotation, anamorphic stretch | bokeh blur |
| `circular-blur-{1-4}` | Circular Blur | radius, center, amount | radial blur variants |
| `gaussian-blur-{1-3}` | Gaussian Blur | strength, aspect, opacity, blendMode | soft blur variants |
| `motion-blur` | Motion Blur | angle, distance | directional blur |
| `radial-blur` | Radial Blur | center, amount | spin blur |
| `blur-sharpen` | Blur/Sharp | blur, sharpen amounts | combined |
| `zoom-blur` | Zoom Blur | center, strength | zoom burst |

### 9.2 COLOR (14 effects)

| ID | Name | Key Parameters |
|----|------|---------------|
| `thermal-{1-3}` | Thermal | palette variants |
| `curves` | Curves | d_curve (points), d_curve_r, d_curve_g, d_curve_b; apply_mode |
| `color-balance` | Color Balance | shadows/mids/highlights RGB shifts |
| `color-temperature` | Color Temperature | warmth slider |
| `dither` | Dither | pattern (23), palette (12), color count (2-18), pixelation |
| `map-to-gradient` | Map to Gradient | gradient definition |
| `hue-saturation` | Hue/Saturation | hue, saturation, lightness |
| `levels` | Levels | input_levels [black, white], midpoint, output_levels, affect_luma_only |
| `exposure` | Exposure | exposure value |
| `monochrome` | Monochrome | downmix weights, normalize, tint_color |
| `color-matrix` | Color Matrix | 4×4 matrix values |
| `rgb-gain-gamma` | RGB Gain | r/g/b gain + gamma |
| `contrast` | Contrast | contrast value |
| `print-stamp` | Print Stamp | (Custom category) |

### 9.3 DISTORT (11 effects)

| ID | Name | Key Parameters |
|----|------|---------------|
| `elastic-grid` | Elastic Grid | grid size, noise distortion, loop |
| `reeded-glass` | Reeded Glass | refraction, chromatic dispersion, reflection |
| `cubify` | Cubify | cube size, perspective |
| `glitch` | Glitch | intensity, block size, color shift |
| `perspective` | Perspective | 4-corner transform |
| `pinch` | Pinch | center, amount |
| `polar-to-rectangular` | Polar to Rectangular | stretch |
| `rectangular-to-polar` | Rectangular to Polar | amount |
| `ripple` | Ripple | frequency, amplitude, phase |
| `transform` | Transform | translate, scale, rotate |
| `swirl` | Swirl | center, radius, angle |

### 9.4 EFFECTS (13 effects)

| ID | Name | Key Parameters |
|----|------|---------------|
| `ascii` | ASCII | character set, brightness, font size |
| `halftone-screen` | Halftone Screen | dot size, angle, shape |
| `emboss` | Emboss | 36 materials, shadow, light direction |
| `bloom` | Bloom | threshold, intensity, knee, bloom_factor, blend_mode, tonemapper |
| `led-screen` | LED Screen | pixel size, grid type |
| `ntsc` | NTSC | composite artifacts, color bleeding |
| `rgb-shift` | RGB Shift | shift amount, angle |
| `crt-screen` | CRT Screen | scanlines, curvature, phosphor |
| `modulation` | Modulation | frequency, wave mode |
| `threshold` | Threshold | threshold value, edge detection |
| `vignette` | Vignette | size, softness, color |
| `stripe` | Stripe | frequency, angle, color |
| `xerox` | Xerox | (from effects listing) |

### 9.5 GENERATE (3 effects)

| ID | Name | Key Parameters |
|----|------|---------------|
| `noise` | Noise | strength, grainSize, minGrain, chroma, shadowWeight, midWeight, highlightWeight, grainSpeed |
| `ink-bleed` | Ink Bleed | amount, decay, intensity, spreadDir, noiseSize, grainAmount, grainSize, d_maskTexture, d_curve, maskStrength, showMask, flushTimerSec |
| `paper-scan` | Paper Scan | grain, distortion, texture overlay |

### 9.6 CUSTOM (3 effects)

These are multi-pass or special effects:

| ID | Name | Key Parameters |
|----|------|---------------|
| `layer-mix` | Layer Mix | blend mode, blend-if controls for highlights/mids/shadows |
| `texture-blur` | Texture Blur | texture mask, bokeh strength per pixel, fit mode, depth curve |
| *(print-stamp)* | Print Stamp | stamp simulation |

---

## 10. Preset System

### 10.1 Preset Data Format

```typescript
interface Preset {
  id: number;
  name: string;
  data: {
    snapshot: string;  // JSON-serialized PresetSnapshot
  };
  hash: string;
  created_at: string;
  updated_at: string;
  share_id: string;     // URL-friendly slug e.g. "soft-editorial"
  cover_url: string;    // CDN URL, can be .jpg or .mp4
  cover_mime: string;
  cover_updated_at: string;
}

interface PresetSnapshot {
  graph: EffectNode[];   // Ordered list of effect nodes
  ui?: PresetUIGroup[];  // Optional grouping metadata
}

interface PresetUIGroup {
  id: string;
  name: string;
  collapsed: boolean;
  hidden: boolean;
  effectIndices: number[];  // Which graph indices belong to this group
}
```

### 10.2 Real Preset Examples

**"Soft editorial"** (5 nodes):
```json
{
  "graph": [
    {"id": "levels", "isOn": true, "values": {"input_levels": [1,0], "midpoint": 1, "output_levels": [0,1], "affect_luma_only": 1}},
    {"id": "bloom",  "isOn": true, "values": {"threshold": 0.37, "intensity": 2.47, "knee": 0.13, "bloom_factor": 1, "blend_mode": 0, "tonemapper": 0}},
    {"id": "levels", "isOn": true, "values": {"input_levels": [0,1], "midpoint": 1, "output_levels": [1,0], "affect_luma_only": 1}},
    {"id": "curves", "isOn": true, "values": {"curve_apply_mode": 0, "d_curve": 0, ...}, "meta": {"d_curve": {"curvePoints": [...]}}},
    {"id": "curves", "isOn": true, "values": {"curve_apply_mode": 1, ...}, "meta": {...}}
  ],
  "ui": [{"id": "g29", "name": "soft darks", "collapsed": false, "hidden": false, "effectIndices": [0,1,2,3,4]}]
}
```

**"Y2K blue"** (6 nodes): curves → gaussian-blur → noise → monochrome → curves → curves

**"Soft bleed cracks"** (3 nodes): noise → ink-bleed → curves

### 10.3 Preset UI

**Preset Edit Modal** (`#preset-edit-modal`):
- Cover image: auto-captured from current canvas, or manually uploaded
- Name input
- Save button
- Share link generation (produces `?preset=<share_id>` URL)

**Preset Panel** (in right aside):
- Replaces effect controls panel when a preset is selected
- Shows grouped view of effects in the preset
- Groups can be collapsed/expanded

### 10.4 Preset API

```
GET  /api/presets/public          → public curated presets
GET  /api/presets                 → user's saved presets (auth required)
POST /api/presets                 → create preset (auth required)
PUT  /api/presets/:id             → update preset (auth required)
DELETE /api/presets/:id           → delete preset (auth required)
GET  /api/presets/:share_id       → get preset by share slug (public)
```

---

## 11. Layer System

Each "layer" is a media source (image or video) in the stack. The effect graph processes the **blended** result of all active layers.

```typescript
interface Layer {
  id: string;
  name: string;          // User-editable label
  source: MediaSource;   // Image or Video element
  visible: boolean;      // Eye icon toggle
  // blendMode: BlendMode  // (future Pro feature, implied by Layer Mix effect)
}
```

**Layer management**:
- Drag to reorder (draggable handles)
- Toggle visibility (eye icon)
- The upload area is inside the layers panel
- Pro users can add multiple layers; free users: 1 layer implied

---

## 12. Export System

### 12.1 Export Format Options

| Format | Free | Pro | Notes |
|--------|------|-----|-------|
| PNG | 1080p max | 4K max | Still image |
| JPEG | 1080p max | 4K max | Still image |
| MP4 | 10s max (from video source) | 120s max | Video export |
| WebM | 10s max | 120s max | Video export |
| GIF | Limited | 120s max | Animation |
| Animated from still | ✗ | ✓ | Loop animated effect |

### 12.2 Export Limits by Plan

```typescript
const PLANS = {
  free:  { exportRes: 1080, maxDuration: 10,       watermark: true  },
  pro:   { exportRes: 4096, maxDuration: 120,       watermark: false },
  ultra: { exportRes: 16384, maxDuration: Infinity, watermark: false },
};
```

### 12.3 Export Menu HTML Structure

```html
<div id="export-menu" class="export-menu menu">
  <div class="export-menu__content">
    <!-- Animation section (disabled for free+still) -->
    <div class="export-menu__section export-menu__section--disabled">
      <div class="export-menu__section-title">ANIMATION</div>
      <div class="export-menu__toggle-group">...</div>
    </div>

    <!-- Format section -->
    <div id="format-section" class="export-menu__section">
      <div class="export-menu__section-title">FORMAT</div>
      <div id="format-toggle-group" class="export-menu__toggle-group">
        <!-- Toggle buttons: PNG | JPEG | MP4 | WebM | GIF -->
      </div>
    </div>

    <!-- Resolution section (disabled for free at 4K) -->
    <div class="export-menu__section export-menu__section--disabled">
      <div class="export-menu__section-title">RESOLUTION</div>
      ...
    </div>
  </div>
</div>
```

### 12.4 Export Implementation

**PNG/JPEG**: `gl.readPixels()` → `canvas.toDataURL()`

**Video**: Use browser's `MediaRecorder` API:
```typescript
const stream = canvas.captureStream(targetFPS);
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
// Record for duration, then stop and save blob
```

**Watermark** (free tier): Composite "effect.app" text overlay using Canvas 2D API.

---

## 13. Authentication System

### 13.1 Auth Flow

```
Sign Up:
  1. Enter email + password
  2. POST /api/auth/register → {status: "verification_required"}
  3. User receives 6-digit code via email
  4. Enter code → POST /api/auth/verify-code → {access_token: "..."}
  5. Store token in httpOnly cookie (or localStorage for personal use)

Log In:
  1. Enter email + password
  2. POST /api/auth/login → {access_token: "..."} or {error: "VALIDATION_ERROR"}

Google OAuth:
  1. POST /api/auth/google → redirect to Google
  2. Callback → token exchange
  3. Figma variant: /api/auth/figma/google/status/:id (polling)
```

### 13.2 Auth State

The app uses `.anon-only` and `.user-only` CSS classes on elements to toggle visibility. On auth state change, a global class or data attribute on `<body>` controls these.

```typescript
// Visitor tracking
const VISITOR_ID_KEY = 'visitor_id';
const VISITOR_PROFILE_TS_KEY = 'visitor_profile_ts_v1:';

// Auth state
interface AuthState {
  isLoggedIn: boolean;
  user?: {
    email: string;
    avatar?: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
}
```

### 13.3 Auth Modals

Three modal states:
1. **Sign Up**: Google button + email/password form + ToS link
2. **Log In**: email/password form + Google button (reversed order)
3. **Code Verification**: 6 individual digit inputs (autofocus, paste support, backspace)

---

## 14. Backend API Specification

For a personal recreation, all endpoints can be simplified or mocked. Full API:

```
Authentication:
  POST /api/auth/register          { email, password }
  POST /api/auth/login             { email, password }
  POST /api/auth/verify-code       { email, code }
  POST /api/auth/resend-code       { email }
  POST /api/auth/google            → OAuth redirect
  GET  /api/auth/google/callback
  GET  /api/auth/logout

Users:
  GET  /api/users/me               → current user profile + plan
  PATCH /api/users/me              { email?, avatar? }
  DELETE /api/users/me             → delete account

Presets:
  GET  /api/presets/public         → all public/curated presets
  GET  /api/presets                → user presets (auth)
  POST /api/presets                { name, snapshot, cover? }
  PUT  /api/presets/:id            { name?, snapshot?, cover? }
  DELETE /api/presets/:id
  GET  /api/presets/share/:slug    → get by share_id

Payments (Lemon Squeezy):
  POST /api/checkout               → create checkout session
  GET  /api/checkout/status        → poll subscription status
  POST /api/webhooks/lemonsqueezy  → payment events webhook

Analytics:
  POST /api/events                 { event, properties }
```

**For personal use** (no backend): Replace the API with `localStorage`:
```typescript
// Store presets in localStorage
const PRESETS_KEY = 'effekt:presets';
```

---

## 15. Data Models

### 15.1 Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT,           -- NULL if Google-only
  google_id   TEXT UNIQUE,
  avatar_url  TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verification_codes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  code      CHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used      BOOLEAN DEFAULT FALSE
);

CREATE TABLE presets (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  snapshot    JSONB NOT NULL,   -- { graph: [], ui: [] }
  share_id    TEXT UNIQUE,      -- slug for public sharing
  cover_url   TEXT,
  cover_mime  TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  hash        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  lemon_squeezy_id TEXT UNIQUE,
  plan            TEXT NOT NULL,
  status          TEXT NOT NULL,  -- 'active', 'cancelled', 'past_due'
  billing_cycle   TEXT,           -- 'monthly', 'yearly'
  current_period_end TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 15.2 Effect Configuration Schema

```typescript
// Defines available parameters for each effect
interface EffectDefinition {
  id: string;
  name: string;
  category: string;
  shader: string | string[];  // GLSL file path(s) relative to /effects/
  preview: string;            // Preview image filename
  searchable: string;         // Search keywords
  params: ParamDefinition[];
}

interface ParamDefinition {
  name: string;               // Uniform name in GLSL
  label: string;              // Display name in UI
  type: 'slider' | 'toggle' | 'color' | 'select' | 'curve' | 'gradient' | 'texture';
  default: EffectValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];         // For select type
}
```

---

## 16. Subscription / Tier System

### Feature Matrix

| Feature | Free | Pro ($12/mo or $10.80/mo yearly) | Enterprise |
|---------|------|----------------------------------|-----------|
| Export resolution | 1080p | 4K | Unlimited |
| Video export length | 10s | 120s | 120s+ |
| Animated from still | ✗ | ✓ | ✓ |
| Watermark | ✓ | ✗ | ✗ |
| Custom presets | ✗ | Up to 10 | Unlimited |
| Preset sharing | ✗ | ✓ | ✓ |
| Version history | ✓ | ✓ | ✓ |
| Figma plugin | ✓ | ✓ | ✓ |
| Commercial license | ✗ | ✓ | ✓ |
| Priority support | ✗ | ✗ | ✓ |
| Custom integrations | ✗ | ✗ | ✓ |

### Plan Detection in UI

The app uses CSS class toggling for plan-gated features:
```css
/* Default: show free content, hide pro content */
.pro-only { display: none; }
.free-only { display: block; }

/* Applied to <body> when user has pro plan */
body.plan-pro .pro-only { display: block; }
body.plan-pro .free-only { display: none; }
```

---

## 17. Landing Page

### Route: `/features`

Full-page marketing site with these sections:

```
1. Header (sticky nav):
   [Logo] [Sign up modal CTA] [Upgrade link]

2. Effect Dock (landing version):
   Horizontal scrollable strip showing all effects
   "The dock" — same component as in app

3. Hero section:
   H1: "OPEN. PLAY. EXPORT."
   H2: "APPLY 40+ EFFECTS TO IMAGES AND VIDEOS. PRO QUALITY IN YOUR BROWSER WITHOUT INSTALLATIONS OR LONG WAITS."
   CTA: [LAUNCH APP]
   Video carousel: 3 demo videos with indicators

4. Features grid (6 cards):
   - Real-time effects + live controls
   - Export video and animations
   - Save and share presets
   - Art-directed looks library
   - Use effects in Figma
   - Browser extension
   - iOS app (coming soon)

5. "Built by creators" section (4 value props):
   - Private by design (local processing)
   - Art-directed (curated effects)
   - Always improving (frequent updates)
   - Small team (responsive)

6. Examples gallery (masonry grid):
   4 columns × 5 rows of user-created work
   Fade overlay + "See more on Instagram" link

7. Testimonials (4 cards):
   Twitter-style quote cards

8. Pricing section:
   Monthly/Yearly toggle
   Free | Pro | Enterprise cards

9. FAQ section:
   <details>/<summary> elements, 7 questions

10. Footer:
    Product links | Legal | Social
    "LAUNCH APP" CTA button
```

---

## 18. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl +` | Zoom in |
| `Ctrl -` | Zoom out |
| `Ctrl 0` | Zoom to 100% |
| `Shift 1` | Zoom to fit |
| `Ctrl Z` | Undo (50-step history) |
| `Ctrl Shift Z` | Redo |
| `Ctrl S` | Save / export |
| `Space` | Play/pause video |
| `R` | Randomize effect parameters |
| `Escape` | Close modal / deselect |

---

## 19. Figma Plugin & Chrome Extension

### Figma Plugin (ID: 1504395974062742075)

- Apply effects to any Figma frame
- Opens an iframe pointing to `effect.app` with `?source=figma` param
- Plugin communicates via `window.postMessage` (`pluginMessage` events)
- `RECEIVE_ACCESS_TOKEN` message type — token passed from app to plugin
- Saves result as frame fill, not a new object
- Window is resizable
- Auth flow: `/api/auth/figma/login`, `/api/auth/figma/google/status/:id`

### Chrome Extension

- Right-click any image → "Edit in Effect.app"
- Sends the image URL to the active Effect.app tab
- URL import: `input-button-url` button in the media input area

---

## 20. Implementation Roadmap

### Phase 1 — Core MVP (local, no backend)
1. Set up Vite + TypeScript project with the CSS design system
2. Implement WebGL2 context + ping-pong framebuffer pipeline
3. Implement 5 core effects as GLSL: `noise`, `levels`, `gaussian-blur`, `curves`, `vignette`
4. Build the media input (file upload → WebGL texture)
5. Build the controls panel with slider param controls
6. Build the export (PNG via readPixels)

### Phase 2 — Full Effect Library
7. Implement remaining ~46 effects as GLSL shaders
8. Build the effect selector/browser panel
9. Build the dock component with hover animations
10. Add keyboard shortcuts and undo/redo (50-step history)
11. Add video support (HTMLVideoElement as texture source + MediaRecorder export)
12. Add zoom/pan canvas controls

### Phase 3 — Presets & Auth
13. Build preset creation/loading (localStorage first)
14. Add PostgreSQL backend (Bun + Hono or Fastify)
15. Implement auth (email + Google OAuth)
16. Implement preset API
17. Add preset sharing via slug URLs

### Phase 4 — Polish
18. Build the landing page (`/features`)
19. Add the explore gallery page
20. Add the changelog page
21. Implement pro watermark system (for learning purposes)
22. Mobile touch support

---

## Key Reference Links

- [effect.app](https://effect.app/) — Live application
- [glfx.js](https://github.com/evanw/glfx.js) — Classic WebGL image effects library (good GLSL reference)
- [image-editor-effects](https://github.com/alaingalvan/image-editor-effects) — Photoshop-style GLSL shaders
- [bbc/VideoContext](https://github.com/bbc/VideoContext) — WebGL video compositing reference
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/) — Best WebGL 2 tutorial resource
- [GLSL Sandbox](http://glslsandbox.com/) — Live shader testing
- [ShaderToy](https://www.shadertoy.com/) — Large library of GLSL effects to reference
- [VFX-JS](https://tympanus.net/codrops/2025/01/20/vfx-js-webgl-effects-made-easy/) — Modern WebGL effects library
- [web.dev: Real-Time Effects](https://web.dev/articles/manipulating-live-effects) — WebGL image processing tutorial

---

*Spec generated by examining effect.app via Playwright, network inspection, and public API analysis.*
*Last updated: 2026-03-04*
