export class CanvasViewport {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  onZoomChange: ((zoom: number) => void) | null = null;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;

    // Wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldZoom = this.zoom;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(0.1, Math.min(20, this.zoom * delta));

      // Zoom toward mouse position
      const ratio = this.zoom / oldZoom;
      this.panX = mouseX - ratio * (mouseX - this.panX);
      this.panY = mouseY - ratio * (mouseY - this.panY);

      this.applyTransform();
    }, { passive: false });

    // Pan: middle-click or Alt+left-click
    container.addEventListener('pointerdown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        this.isPanning = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        container.style.cursor = 'grabbing';
        container.setPointerCapture(e.pointerId);
      }
    });

    container.addEventListener('pointermove', (e) => {
      if (!this.isPanning) return;
      this.panX += e.clientX - this.lastPointerX;
      this.panY += e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.applyTransform();
    });

    container.addEventListener('pointerup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        container.style.cursor = '';
        container.releasePointerCapture(e.pointerId);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          this.zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          this.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          this.resetZoom();
        }
      }
      if (e.shiftKey && e.key === '!') {
        e.preventDefault();
        this.fitToScreen();
      }
    });
  }

  private applyTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.onZoomChange?.(this.zoom);
  }

  zoomIn() {
    this.zoom = Math.min(20, this.zoom * 1.2);
    this.applyTransform();
  }

  zoomOut() {
    this.zoom = Math.max(0.1, this.zoom / 1.2);
    this.applyTransform();
  }

  resetZoom() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  fitToScreen() {
    const containerRect = this.container.getBoundingClientRect();
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    if (canvasW === 0 || canvasH === 0) return;

    const padding = 0.9;
    const scaleX = (containerRect.width * padding) / canvasW;
    const scaleY = (containerRect.height * padding) / canvasH;
    this.zoom = Math.min(scaleX, scaleY);

    // Center the canvas
    this.panX = (containerRect.width - canvasW * this.zoom) / 2;
    this.panY = (containerRect.height - canvasH * this.zoom) / 2;
    this.applyTransform();
  }

  getZoom(): number {
    return this.zoom;
  }
}
