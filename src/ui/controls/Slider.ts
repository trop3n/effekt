import type { ParamDefinition } from '../../types.ts';

export class Slider {
  readonly element: HTMLElement;
  private valueDisplay: HTMLSpanElement;
  private range: HTMLInputElement;

  constructor(
    param: ParamDefinition,
    value: number,
    onChange: (value: number) => void,
    onDragStart?: () => void,
    onDragEnd?: () => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'param-control';

    const header = document.createElement('div');
    header.className = 'param-control__header';

    const label = document.createElement('span');
    label.textContent = param.label;

    this.valueDisplay = document.createElement('span');
    this.valueDisplay.className = 'param-control__value';
    this.valueDisplay.textContent = value.toFixed(2);

    header.appendChild(label);
    header.appendChild(this.valueDisplay);

    this.range = document.createElement('input');
    this.range.type = 'range';
    this.range.className = 'param-control__range';
    this.range.min = String(param.min ?? 0);
    this.range.max = String(param.max ?? 1);
    this.range.step = String(param.step ?? 0.01);
    this.range.value = String(value);

    this.range.addEventListener('input', () => {
      const v = parseFloat(this.range.value);
      this.valueDisplay.textContent = v.toFixed(2);
      onChange(v);
    });

    this.range.addEventListener('pointerdown', () => {
      onDragStart?.();
    });

    this.range.addEventListener('pointerup', () => {
      onDragEnd?.();
    });

    this.element.appendChild(header);
    this.element.appendChild(this.range);
  }

  setValue(value: number) {
    this.range.value = String(value);
    this.valueDisplay.textContent = value.toFixed(2);
  }
}
