import { WebGLContext } from './gl/WebGLContext.ts';
import { Pipeline } from './gl/Pipeline.ts';
import { uploadImageTexture } from './gl/TextureLoader.ts';
import { EffectGraph } from './effects/EffectGraph.ts';
import { effectDefinitions, effectRegistry } from './effects/registry.ts';
import { History } from './history/History.ts';
import { MediaInput } from './media/MediaInput.ts';
import { Header } from './ui/Header.ts';
import { Dock } from './ui/Dock.ts';
import { LayersPanel } from './ui/LayersPanel.ts';
import { ControlsPanel } from './ui/ControlsPanel.ts';
import { Toolbar } from './ui/Toolbar.ts';
import { CanvasViewport } from './ui/CanvasViewport.ts';
import { exportFromCanvas } from './export/ExportPNG.ts';
import { PresetModal } from './ui/PresetModal.ts';
import type { ExportFormat } from './export/ExportPNG.ts';
import type { EffectDefinition } from './types.ts';
import type { EffectNode } from './effects/EffectNode.ts';

// --- Init WebGL ---
const canvasContainer = document.getElementById('canvas-container')!;
const ctx = new WebGLContext(canvasContainer);
const { gl } = ctx;
const pipeline = new Pipeline(gl);

// --- History ---
const history = new History();

// --- Curves LUT texture ---
let curvesLUTTexture: WebGLTexture | null = null;
function initCurvesLUT() {
  curvesLUTTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, curvesLUTTexture);
  // Identity LUT (diagonal)
  const identity = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    identity[i * 4] = i;
    identity[i * 4 + 1] = i;
    identity[i * 4 + 2] = i;
    identity[i * 4 + 3] = 255;
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, identity);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}
initCurvesLUT();

function updateCurvesLUT(lut: Uint8Array) {
  gl.bindTexture(gl.TEXTURE_2D, curvesLUTTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lut);
  gl.bindTexture(gl.TEXTURE_2D, null);
  pipeline.requestRender();
}

// --- Helpers ---
function pushSnapshot() {
  history.push(graph.snapshot(layersPanel.getSelectedId()));
}

function restoreSnapshot(snapshot: ReturnType<typeof graph.snapshot>) {
  graph.restore(snapshot, effectRegistry);
  const selectedNode = snapshot.selectedId
    ? graph.nodes.find(n => n.id === snapshot.selectedId) ?? null
    : null;
  layersPanel.setSelectedId(snapshot.selectedId);
  layersPanel.update();
  controlsPanel.select(selectedNode);
  pipeline.setNodes(graph.nodes);
}

// --- Effect Graph ---
const graph = new EffectGraph(() => {
  pipeline.setNodes(graph.nodes);
  layersPanel.update();
  toolbar.updateResolution(pipeline.getImageDimensions().width, pipeline.getImageDimensions().height);
});

// --- UI ---
const headerEl = document.getElementById('app-header')!;
const layersEl = document.getElementById('aside-layers')!;
const controlsEl = document.getElementById('aside-controls')!;
const dockEl = document.getElementById('dock')!;
const toolbarEl = document.getElementById('toolbar')!;

// Media input
const mediaInput = new MediaInput((image) => {
  const tex = uploadImageTexture(gl, image);
  ctx.resize(image.naturalWidth, image.naturalHeight);
  pipeline.setSource(tex, image.naturalWidth, image.naturalHeight);
  pipeline.setNodes(graph.nodes);
  toolbar.updateResolution(image.naturalWidth, image.naturalHeight);
});

// Preset modal
const presetModalEl = document.getElementById('preset-modal')!;
const presetModal = new PresetModal(
  presetModalEl,
  () => graph.snapshot(layersPanel.getSelectedId()),
  (snapshot) => {
    pushSnapshot();
    restoreSnapshot(snapshot);
    pushSnapshot();
  },
);

// Header
new Header(
  headerEl,
  () => mediaInput.openFilePicker(),
  () => presetModal.openLoad(),
  () => presetModal.openSave(),
);

// Drag-and-drop on canvas container
mediaInput.setupDropZone(canvasContainer);

// Controls panel (with drag start/end for history)
let preDragSnapshot: ReturnType<typeof graph.snapshot> | null = null;

const controlsPanel = new ControlsPanel(
  controlsEl,
  () => pipeline.requestRender(),
  (lut) => updateCurvesLUT(lut),
  () => {
    // onDragStart: capture pre-drag state
    preDragSnapshot = graph.snapshot(layersPanel.getSelectedId());
  },
  () => {
    // onDragEnd: push both pre and post state
    if (preDragSnapshot) {
      history.push(preDragSnapshot);
      pushSnapshot();
      preDragSnapshot = null;
    }
  },
);

// Layers panel
const layersPanel = new LayersPanel(
  layersEl,
  graph,
  mediaInput,
  (node: EffectNode | null) => {
    controlsPanel.select(node);
  },
  () => {
    // onReorder: push history
    pushSnapshot();
  },
);

// Dock
function addEffect(def: EffectDefinition) {
  pushSnapshot();
  const node = graph.add(def);
  layersPanel.selectNode(node);
  controlsPanel.select(node);
  pushSnapshot();
}

new Dock(dockEl, effectDefinitions, addEffect);

// Toolbar
const toolbar = new Toolbar(
  toolbarEl,
  (format: ExportFormat, quality: number) => {
    exportFromCanvas(gl, format, quality);
  },
  () => pipeline.getImageDimensions(),
);

// Canvas viewport (zoom/pan)
const canvas = canvasContainer.querySelector('canvas')!;
const viewport = new CanvasViewport(canvasContainer, canvas);

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
  // Export
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportFromCanvas(gl);
  }

  // Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    const snapshot = history.undo();
    if (snapshot) restoreSnapshot(snapshot);
  }

  // Redo
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    const snapshot = history.redo();
    if (snapshot) restoreSnapshot(snapshot);
  }
});

// --- Window resize ---
function handleResize() {
  const dims = pipeline.getImageDimensions();
  if (dims.width > 0 && dims.height > 0) {
    pipeline.requestRender();
  }
}
window.addEventListener('resize', handleResize);
