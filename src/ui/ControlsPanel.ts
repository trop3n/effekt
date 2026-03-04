import type { EffectNode } from '../effects/EffectNode.ts';
import { Slider } from './controls/Slider.ts';
import { CurveEditor } from './controls/CurveEditor.ts';

export class ControlsPanel {
  readonly element: HTMLElement;
  private onParamChange: () => void;
  private onCurveLUT: ((lut: Uint8Array) => void) | null = null;
  private onDragStart: (() => void) | null = null;
  private onDragEnd: (() => void) | null = null;
  private selectedNode: EffectNode | null = null;

  constructor(
    container: HTMLElement,
    onParamChange: () => void,
    onCurveLUT?: (lut: Uint8Array) => void,
    onDragStart?: () => void,
    onDragEnd?: () => void,
  ) {
    this.element = container;
    this.onParamChange = onParamChange;
    this.onCurveLUT = onCurveLUT ?? null;
    this.onDragStart = onDragStart ?? null;
    this.onDragEnd = onDragEnd ?? null;
    this.showEmpty();
  }

  select(node: EffectNode | null) {
    this.selectedNode = node;
    this.element.innerHTML = '';

    if (!node) {
      this.showEmpty();
      return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'controls-header';

    const name = document.createElement('span');
    name.className = 'controls-header__name';
    name.textContent = node.definition.name;

    const actions = document.createElement('div');
    actions.className = 'controls-header__actions';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'button-icon';
    resetBtn.title = 'Reset to defaults';
    resetBtn.innerHTML = '&#x21BA;'; // ↺
    resetBtn.addEventListener('click', () => {
      node.resetToDefaults();
      this.select(node); // Re-render controls
      this.onParamChange();
    });
    actions.appendChild(resetBtn);

    header.appendChild(name);
    header.appendChild(actions);
    this.element.appendChild(header);

    // Param controls
    if (node.definition.id === 'curves') {
      const editor = new CurveEditor((lut) => {
        this.onCurveLUT?.(lut);
        this.onParamChange();
      });
      this.element.appendChild(editor.element);
    }

    for (const param of node.definition.params) {
      if (param.type === 'slider') {
        const value = node.values[param.name] as number;
        const slider = new Slider(
          param,
          value,
          (v) => {
            node.values[param.name] = v;
            this.onParamChange();
          },
          () => this.onDragStart?.(),
          () => this.onDragEnd?.(),
        );
        this.element.appendChild(slider.element);
      }
    }
  }

  private showEmpty() {
    this.element.innerHTML = '';
    const msg = document.createElement('div');
    msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-size:12px;';
    msg.textContent = 'Select an effect to edit';
    this.element.appendChild(msg);
  }
}
