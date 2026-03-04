interface CurvePoint {
  x: number;
  y: number;
}

export class CurveEditor {
  readonly element: HTMLElement;
  private svg: SVGSVGElement;
  private pathEl: SVGPathElement;
  private points: CurvePoint[] = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ];
  private onChange: (lut: Uint8Array) => void;
  private dragging: number | null = null;
  private readonly size = 256;

  constructor(onChange: (lut: Uint8Array) => void) {
    this.onChange = onChange;

    this.element = document.createElement('div');
    this.element.className = 'curve-editor';

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 256 256');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';

    // Background grid lines
    for (let i = 64; i < 256; i += 64) {
      const lineH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineH.setAttribute('x1', '0');
      lineH.setAttribute('y1', String(i));
      lineH.setAttribute('x2', '256');
      lineH.setAttribute('y2', String(i));
      lineH.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      lineH.setAttribute('stroke-width', '1');
      this.svg.appendChild(lineH);

      const lineV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineV.setAttribute('x1', String(i));
      lineV.setAttribute('y1', '0');
      lineV.setAttribute('x2', String(i));
      lineV.setAttribute('y2', '256');
      lineV.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      lineV.setAttribute('stroke-width', '1');
      this.svg.appendChild(lineV);
    }

    // Diagonal reference line
    const diag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    diag.setAttribute('x1', '0');
    diag.setAttribute('y1', '256');
    diag.setAttribute('x2', '256');
    diag.setAttribute('y2', '0');
    diag.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    diag.setAttribute('stroke-width', '1');
    this.svg.appendChild(diag);

    // Curve path
    this.pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.pathEl.setAttribute('fill', 'none');
    this.pathEl.setAttribute('stroke', 'white');
    this.pathEl.setAttribute('stroke-width', '2');
    this.svg.appendChild(this.pathEl);

    this.element.appendChild(this.svg);

    // Events
    this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
    this.svg.addEventListener('dblclick', (e) => this.handleDblClick(e));

    this.updatePath();
    this.emitLUT();
  }

  private getSVGCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  private handleMouseDown(e: MouseEvent) {
    const { x, y } = this.getSVGCoords(e);
    // Find closest point
    let closestIdx = -1;
    let closestDist = 0.04; // threshold
    for (let i = 0; i < this.points.length; i++) {
      const dx = this.points[i]!.x - x;
      const dy = this.points[i]!.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    if (closestIdx >= 0) {
      this.dragging = closestIdx;
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.dragging === null) return;
    const { x, y } = this.getSVGCoords(e);
    const pt = this.points[this.dragging]!;

    // First and last points are locked on x
    if (this.dragging === 0) {
      pt.y = y;
    } else if (this.dragging === this.points.length - 1) {
      pt.y = y;
    } else {
      pt.x = x;
      pt.y = y;
    }

    this.updatePath();
    this.emitLUT();
  }

  private handleMouseUp() {
    this.dragging = null;
  }

  private handleDblClick(e: MouseEvent) {
    const { x, y } = this.getSVGCoords(e);

    // Check if clicking near existing point (to remove)
    for (let i = 1; i < this.points.length - 1; i++) {
      const dx = this.points[i]!.x - x;
      const dy = this.points[i]!.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.04) {
        this.points.splice(i, 1);
        this.updatePath();
        this.emitLUT();
        return;
      }
    }

    // Add new point
    const insertIdx = this.points.findIndex(p => p.x > x);
    this.points.splice(insertIdx === -1 ? this.points.length : insertIdx, 0, { x, y });
    this.updatePath();
    this.emitLUT();
  }

  private updatePath() {
    // Draw points and path on SVG
    // Remove old point circles
    this.svg.querySelectorAll('circle').forEach(c => c.remove());

    const sorted = [...this.points].sort((a, b) => a.x - b.x);
    const lut = this.evaluateSpline(sorted);

    let d = '';
    for (let i = 0; i < 256; i++) {
      const x = i;
      const y = 256 - lut[i]!;
      d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
    }
    this.pathEl.setAttribute('d', d);

    // Draw control points
    for (const pt of this.points) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(pt.x * 256));
      circle.setAttribute('cy', String((1 - pt.y) * 256));
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', 'white');
      circle.setAttribute('stroke', 'none');
      circle.style.cursor = 'grab';
      this.svg.appendChild(circle);
    }
  }

  private evaluateSpline(points: CurvePoint[]): number[] {
    const result = new Array<number>(256);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      result[i] = Math.round(this.catmullRomInterp(points, t) * 255);
    }
    return result;
  }

  private catmullRomInterp(points: CurvePoint[], x: number): number {
    if (points.length < 2) return x;

    // Find the segment
    let idx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i]!.x && x <= points[i + 1]!.x) {
        idx = i;
        break;
      }
      if (i === points.length - 2) idx = i;
    }

    const p0 = points[Math.max(0, idx - 1)]!;
    const p1 = points[idx]!;
    const p2 = points[Math.min(points.length - 1, idx + 1)]!;
    const p3 = points[Math.min(points.length - 1, idx + 2)]!;

    const range = p2.x - p1.x;
    if (range < 0.001) return p1.y;

    const t = (x - p1.x) / range;
    const t2 = t * t;
    const t3 = t2 * t;

    const v = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    return Math.max(0, Math.min(1, v));
  }

  private emitLUT() {
    const sorted = [...this.points].sort((a, b) => a.x - b.x);
    const values = this.evaluateSpline(sorted);
    // Build RGBA LUT: for now, same curve on R/G/B/A
    const lut = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      const v = values[i]!;
      lut[i * 4] = v;     // R
      lut[i * 4 + 1] = v; // G
      lut[i * 4 + 2] = v; // B
      lut[i * 4 + 3] = 255;
    }
    this.onChange(lut);
  }

  getLUT(): Uint8Array {
    const sorted = [...this.points].sort((a, b) => a.x - b.x);
    const values = this.evaluateSpline(sorted);
    const lut = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      const v = values[i]!;
      lut[i * 4] = v;
      lut[i * 4 + 1] = v;
      lut[i * 4 + 2] = v;
      lut[i * 4 + 3] = 255;
    }
    return lut;
  }
}
