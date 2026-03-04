import type { EffectGraph } from '../effects/EffectGraph.ts';
import type { EffectNode } from '../effects/EffectNode.ts';
import type { MediaInput } from '../media/MediaInput.ts';

export class LayersPanel {
  private container: HTMLElement;
  private listEl: HTMLElement;
  private graph: EffectGraph;
  private onSelect: (node: EffectNode | null) => void;
  private onReorder: (() => void) | null;
  private selectedId: string | null = null;

  constructor(
    container: HTMLElement,
    graph: EffectGraph,
    mediaInput: MediaInput,
    onSelect: (node: EffectNode | null) => void,
    onReorder?: () => void,
  ) {
    this.container = container;
    this.graph = graph;
    this.onSelect = onSelect;
    this.onReorder = onReorder ?? null;

    // Upload zone
    const uploadZone = document.createElement('div');
    uploadZone.className = 'media-input';
    const uploadLabel = document.createElement('span');
    uploadLabel.className = 'media-input__label';
    uploadLabel.textContent = 'Upload Image';
    uploadZone.appendChild(uploadLabel);
    uploadZone.addEventListener('click', () => mediaInput.openFilePicker());
    mediaInput.setupDropZone(uploadZone);
    container.appendChild(uploadZone);

    // Section label
    const label = document.createElement('div');
    label.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);margin-bottom:var(--space-2);';
    label.textContent = 'Layers';
    container.appendChild(label);

    // Layer list
    this.listEl = document.createElement('ol');
    this.listEl.className = 'layers__list';
    container.appendChild(this.listEl);
  }

  update() {
    this.listEl.innerHTML = '';

    for (let i = 0; i < this.graph.nodes.length; i++) {
      const node = this.graph.nodes[i]!;
      const li = document.createElement('li');
      li.className = 'layers__item';
      li.draggable = true;
      if (node.id === this.selectedId) li.classList.add('active');

      // Drag-and-drop
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer!.setData('text/plain', String(i));
        e.dataTransfer!.effectAllowed = 'move';
        li.classList.add('dragging');
      });

      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        // Clean up all drag indicators
        this.listEl.querySelectorAll('.drag-above, .drag-below').forEach(el => {
          el.classList.remove('drag-above', 'drag-below');
        });
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        const rect = li.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        // Clear previous indicators on this item
        li.classList.remove('drag-above', 'drag-below');
        if (e.clientY < midY) {
          li.classList.add('drag-above');
        } else {
          li.classList.add('drag-below');
        }
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-above', 'drag-below');
      });

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-above', 'drag-below');
        const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'), 10);
        const rect = li.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        let toIndex = e.clientY < midY ? i : i;
        // Adjust target index based on drop position
        if (e.clientY >= midY && fromIndex < i) {
          toIndex = i;
        } else if (e.clientY < midY && fromIndex > i) {
          toIndex = i;
        } else if (e.clientY >= midY) {
          toIndex = i + 1;
        }
        // Clamp
        toIndex = Math.max(0, Math.min(toIndex, this.graph.nodes.length - 1));
        if (fromIndex !== toIndex) {
          this.graph.reorder(fromIndex, toIndex);
          this.onReorder?.();
          this.update();
        }
      });

      const handle = document.createElement('div');
      handle.className = 'layers__handle';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'layers__name';
      nameSpan.textContent = node.definition.name;
      handle.appendChild(nameSpan);

      const trail = document.createElement('div');
      trail.className = 'layers__trail';

      // Eye toggle
      const eye = document.createElement('div');
      eye.className = 'layers__icon layers__icon_eye';
      if (!node.isOn) eye.classList.add('off');
      eye.innerHTML = '&#x1F441;'; // 👁
      eye.title = node.isOn ? 'Hide' : 'Show';
      eye.addEventListener('click', (e) => {
        e.stopPropagation();
        this.graph.toggle(node.id);
        this.update();
      });

      // Remove button
      const remove = document.createElement('div');
      remove.className = 'layers__icon';
      remove.innerHTML = '&times;';
      remove.title = 'Remove';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        this.graph.remove(node.id);
        if (this.selectedId === node.id) {
          this.selectedId = null;
          this.onSelect(null);
        }
        this.update();
      });

      trail.appendChild(eye);
      trail.appendChild(remove);

      li.appendChild(handle);
      li.appendChild(trail);

      li.addEventListener('click', () => {
        this.selectedId = node.id;
        this.onSelect(node);
        this.update();
      });

      this.listEl.appendChild(li);
    }
  }

  selectNode(node: EffectNode) {
    this.selectedId = node.id;
    this.update();
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setSelectedId(id: string | null) {
    this.selectedId = id;
  }
}
